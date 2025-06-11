var express = require('express');
var router = express.Router();
var db = require('../db');
const axios = require('axios');

/* GET home page. */
router.get('/', function(req, res, next) {
  db.db.all('SELECT * FROM chicken_price ORDER BY 日期 DESC LIMIT 100', [], function(err, rows) {
    if (err) {
      return next(err);
    }
    res.render('index', { title: 'Express', chickenPrices: rows });
  });
});

// 新增爬蟲 API，支援根據日期區間與品種查詢
router.get('/api/crawl', async function(req, res, next) {
  try {
    const url = 'https://data.moa.gov.tw/Service/OpenData/FromM/PoultryTransLocalBlackChickenData.aspx?IsTransData=1&UnitId=081';
    const response = await axios.get(url);
    let data = response.data;
    const { start, end, variety } = req.query;
    // 過濾日期區間
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      data = data.filter(item => {
        const d = new Date(item['日期']);
        return d >= startDate && d <= endDate;
      });
    }
    // 過濾品種
    if (variety) {
      data = data.map(item => ({
        日期: item['日期'],
        價格: parseFloat(item[variety]) || null
      })).filter(item => item.價格 !== null);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '資料抓取失敗', detail: error.message });
  }
});

module.exports = router;
