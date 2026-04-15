const fs = require('fs');
const path = require('path');
const db = require('./db');

const filePath = path.join(__dirname, '../data/club_card.json');

let clubs;

try {
  clubs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (err) {
  console.error("Failed to read JSON:", err);
  process.exit(1);
}

console.log(`Importing ${clubs.length} clubs...`);

const query = `
  INSERT INTO clubs (id, name, category, description, owner_id)
  VALUES (?, ?, ?, ?, ?)
`;

let completed = 0;

clubs.forEach((club) => {
  db.query(query, [
    club.clubid,
    club.name,
    club.category,
    club.description,
    club.ownerId
  ], (err) => {
    completed++;

    if (err) {
      console.error("Club insert error:", err.message);
    }

    if (completed === clubs.length) {
      console.log("All clubs imported");
      process.exit(0);
    }
  });
});