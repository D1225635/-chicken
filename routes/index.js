var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  db.db.all('SELECT * FROM chicken_price ORDER BY 日期 DESC LIMIT 100', [], function(err, rows) {
    if (err) {
      return next(err);
    }
    res.render('index', { title: 'Express', chickenPrices: rows });
  });
});

module.exports = router;
