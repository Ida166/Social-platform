const fs = require('fs');
const path = require('path');
const db = require('./db');

const filePath = path.join(__dirname, '../data/event_card.json');

let events;

try {
  events = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (err) {
  console.error("Failed to read JSON:", err);
  process.exit(1);
}

console.log(`Importing ${events.length} events...`);

const query = `
  INSERT INTO events 
  (id, club_id, title, date, time, location, description, is_published)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

let completed = 0;

events.forEach((event) => {
  db.query(query, [
    event.eventid,
    event.clubId,
    event.title,
    event.date,
    event.time,
    event.location,
    event.description,
    event.isPublished
  ], (err) => {
    completed++;

    if (err) {
      console.error(`Event insert error ID ${event.eventid}:`, err.message);
    }

    if (completed === events.length) {
      console.log("All events imported");
      process.exit(0);
    }
  });
});
