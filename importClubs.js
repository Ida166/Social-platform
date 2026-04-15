const fs = require('fs');
const path = require('path');
const db = require('./db');

// path to our JSON file 
const filePath = path.join(__dirname, '../data/club_card.json');

// read JSON file
const clubs = JSON.parse(
  fs.readFileSync(filePath, 'utf8')
);

// insert each club into SQL
clubs.forEach(club => {
  db.query(
    `INSERT INTO clubs (id, name, category, description, owner_id)
     VALUES (?, ?, ?, ?, ?)`,
    [
      club.id,
      club.name,
      club.category,
      club.description,
      club.ownerId
    ]
  );
});

