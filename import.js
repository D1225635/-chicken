const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const jsonPath = path.join(__dirname, 'data.json');

const db = new sqlite3.Database(dbPath);

const createTable = `
    CREATE TABLE IF NOT EXISTS chicken_price (
                                                 日期 TEXT NOT NULL,
                                                 品種 TEXT NOT NULL,
                                                 價格 REAL NOT NULL
    );
`;

function runAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function prepareAsync(db, sql) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(sql, (err) => {
            if (err) reject(err);
            else resolve(stmt);
        });
    });
}

(async () => {
    try {
        await runAsync(db, createTable);
        console.log('✅ 資料表已建立');

        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const rawData = JSON.parse(jsonData);

        if (!Array.isArray(rawData)) {
            throw new Error('❌ JSON 格式錯誤');
        }

        const stmt = await prepareAsync(db, "INSERT INTO chicken_price (日期, 品種, 價格) VALUES (?, ?, ?)");

        for (const item of rawData) {
            const date = item['日期'];
            const malePrice = parseFloat(item['黑羽土雞舍飼(南雞)公']);
            const femalePrice = parseFloat(item['黑羽土雞舍飼(南雞)母']);

            if (date) {
                if (!isNaN(malePrice)) {
                    await new Promise((res, rej) =>
                        stmt.run(date, '黑羽土雞舍飼(南雞)公', malePrice, (err) => (err ? rej(err) : res()))
                    );
                }

                if (!isNaN(femalePrice)) {
                    await new Promise((res, rej) =>
                        stmt.run(date, '黑羽土雞舍飼(南雞)母', femalePrice, (err) => (err ? rej(err) : res()))
                    );
                }
            }
        }

        stmt.finalize((err) => {
            if (err) console.error('❌ finalize 錯誤:', err);
            else console.log('✅ 所有資料已寫入資料庫');
            db.close();
        });

    } catch (err) {
        console.error('❌ 匯入失敗:', err);
        db.close();
    }
})();
