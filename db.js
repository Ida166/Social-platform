const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Wpn62skv',
  database: 'social_app'
});

db.connect((err) => {
  if (err) {
    console.log(" MySQL connection failed:", err);
  } else {
    console.log(" Connected to MySQL");
  }
});

module.exports = db;
