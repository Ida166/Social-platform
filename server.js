const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.get('/events', (req, res) => {
  db.query('SELECT * FROM events', (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'something went wrong' });
    }
    res.json(result);
  });
});

app.get('/clubs', (req, res) => {
  db.query('SELECT * FROM clubs', (err, result) => {
    if (err) {
      console.log("Clubs error:", err);
      return res.status(500).json({
        error: err.message
      });
    }

    console.log("CLUBS RESULT:", result);
    res.json(result);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('server running on ' + PORT);
});