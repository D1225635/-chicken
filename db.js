const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const dbDir = path.join(__dirname, 'db');
const dbPath = path.join(dbDir, 'sqlite.db');

// 確保 db 目錄存在
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// 檢查資料庫檔案是否存在
const dbExists = fs.existsSync(dbPath);

// 開啟資料庫
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法開啟資料庫:', err.message);
    } else {
        console.log('成功開啟資料庫');
        if (!dbExists) {
            console.log('資料庫不存在，已新建資料庫');
        }
        // 檢查 chicken_price table 是否存在，若不存在則建立
        db.run(`CREATE TABLE IF NOT EXISTS chicken_price (
            日期 TEXT NOT NULL,
            品種 TEXT NOT NULL,
            價格 REAL NOT NULL
        )`, (err) => {
            if (err) {
                console.error('建立 chicken_price table 失敗:', err.message);
            } else {
                console.log('chicken_price table 已存在或建立成功');
            }
        });
    }
});

async function fetchAndInsertChickenPrice() {
    try {
        const url = 'https://data.moa.gov.tw/Service/OpenData/FromM/PoultryTransLocalBlackChickenData.aspx?IsTransData=1&UnitId=081';
        const response = await axios.get(url);
        const data = response.data;
        if (Array.isArray(data)) {
            const stmt = db.prepare('INSERT INTO chicken_price (日期, 品種, 價格) VALUES (?, ?, ?)');
            data.forEach(row => {
                // 根據 API 回傳欄位名稱調整
                stmt.run(row.日期, row.品種, row.價格);
            });
            stmt.finalize();
            console.log('資料已成功寫入 chicken_price table');
        } else {
            console.error('API 回傳資料格式錯誤');
        }
    } catch (err) {
        console.error('讀取或寫入資料時發生錯誤:', err.message);
    }
}

// 匯出方法
module.exports = { db, fetchAndInsertChickenPrice };
