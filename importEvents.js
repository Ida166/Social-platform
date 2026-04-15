const fs = require('fs');
const path = require('path');
const db = require('./db');

// Path to JSON file
const filePath = path.join(__dirname, '../data/event_card.json');

// Read and parse JSON safely
let events;

try {
  const data = fs.readFileSync(filePath, 'utf8');
  events = JSON.parse(data);
} catch (err) {
  console.error(" Failed to read or parse JSON file:", err);
  process.exit(1);
}

console.log(` Importing ${events.length} events...`);

// Insert each event into MySQL
events.forEach((event) => {
  const query = `
    INSERT INTO events 
    (id, club_id, title, date, time, location, description, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    event.id,
    event.clubId,
    event.title,
    event.date,
    event.time,
    event.location,
    event.description,
    event.isPublished
  ], (err) => {
    if (err) {
      console.error(` Failed to insert event ID ${event.id}:`, err.message);
    }
  });
});

console.log(" Import process started");
