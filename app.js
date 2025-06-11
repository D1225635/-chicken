const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = require('path').join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath);
const axios = require('axios');
const indexRouter = require('./routes/index');

app.use(express.static('public'));
app.use('/', indexRouter);

app.get('/api/query', (req, res) => {
    const { start, end, variety } = req.query;
    db.all(
        `SELECT 日期, 品種, 價格 FROM chicken_price 
     WHERE 日期 BETWEEN ? AND ? AND 品種 = ? 
     ORDER BY 日期`,
        [start, end, variety],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.get('/api/date-range', (req, res) => {
    db.get('SELECT MIN(日期) as min, MAX(日期) as max FROM chicken_price', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ min: row.min, max: row.max });
    });
});

async function fetchAndInsertChickenPrice() {
    const db = new sqlite3.Database(dbPath);
    const url = 'https://data.moa.gov.tw/Service/OpenData/FromM/PoultryTransLocalBlackChickenData.aspx?IsTransData=1&UnitId=081';
    try {
        const response = await axios.get(url);
        const data = response.data;
        if (!Array.isArray(data)) throw new Error('API 回傳資料格式錯誤');
        const stmt = db.prepare('INSERT INTO chicken_price (日期, 品種, 價格) VALUES (?, ?, ?)');
        db.serialize(() => {
            data.forEach(row => {
                if(row.日期 && row.品種 && row.價格) {
                    stmt.run(row.日期, row.品種, parseFloat(row.價格));
                }
            });
        });
        stmt.finalize(() => {
            console.log('資料已成功寫入 chicken_price table');
            db.close();
        });
    } catch (err) {
        console.error('讀取或寫入資料時發生錯誤:', err.message);
        db.close();
    }
}

// 若直接執行 app.js 時自動匯入
if (require.main === module) {
    fetchAndInsertChickenPrice();
}

module.exports = app;
