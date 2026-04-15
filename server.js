const db = require('./db');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.send("Backend is running ");
});

// GET all events
app.get('/events', (req, res) => {
  db.query('SELECT * FROM events', (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

// GET all clubs
app.get('/clubs', (req, res) => {
  db.query('SELECT * FROM clubs', (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

// START SERVER
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});