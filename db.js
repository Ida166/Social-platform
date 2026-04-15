const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'autorack.proxy.rlwy.net',
  user: 'root',
  password: 'xlzKxUNDSMocgAqzccCWvgVhmjzkmZvR',
  database: 'railway',
  port: 27320
});

db.connect((err) => {
  if (err) {
    console.log("MySQL connection failed:", err.message);
  } else {
    console.log("Connected to Railway PUBLIC MySQL");
  }
});

module.exports = db;


