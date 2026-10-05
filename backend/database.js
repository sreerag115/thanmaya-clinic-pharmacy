const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Store the database in the root folder of the project for easy backup/access
const dbPath = path.resolve(__dirname, '../inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign key support
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) console.error('Error enabling foreign keys:', err);
});

// Initialize database schema
db.serialize(() => {
  // Medicines table
  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      low_stock_threshold INTEGER DEFAULT 10,
      price REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (!err) {
      db.run('ALTER TABLE medicines ADD COLUMN price REAL DEFAULT 0.0', (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column name')) {
          console.error('Migration note (price column):', alterErr.message);
        }
      });
    }
  });

  // Batches table
  db.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      manufacture_date TEXT,
      expiry_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    )
  `);
});

// Helper functions that return promises for clean async/await usage
const query = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  // Execute transactional queries
  transaction(callback) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', async (err) => {
          if (err) return reject(err);
          try {
            const result = await callback();
            db.run('COMMIT', (commitErr) => {
              if (commitErr) reject(commitErr);
              else resolve(result);
            });
          } catch (e) {
            db.run('ROLLBACK', () => reject(e));
          }
        });
      });
    });
  }
};

module.exports = { db, query };
