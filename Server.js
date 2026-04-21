const express = require('express')
const cors = require('cors')
const db = require('./db')

const app = express()

app.use(cors())
app.use(express.json())

// test route
app.get('/', (req, res) => {
  res.send("Backend is running")
})

// get all events
app.get('/events', (req, res) => {

  const sql = "SELECT * FROM events"

  db.query(sql, (err, results) => {

    if (err) {
      console.error("Database error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results)

  })

})

// get all clubs
app.get('/clubs', (req, res) => {

  const sql = "SELECT * FROM clubs"

  db.query(sql, (err, results) => {

    if (err) {
      console.error("Database error:", err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(results)

  })

})

const PORT = 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})