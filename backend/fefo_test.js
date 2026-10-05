const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const testDbPath = path.resolve(__dirname, 'test_inventory.db');

// Clean up previous test DB if any
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new sqlite3.Database(testDbPath);

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
  }
};

async function runTest() {
  console.log('--- STARTING FEFO TEST ---');
  
  // 1. Create tables
  await query.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      low_stock_threshold INTEGER DEFAULT 10
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      manufacture_date TEXT,
      expiry_date TEXT NOT NULL,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
    )
  `);

  console.log('Tables created.');

  // 2. Insert test medicine
  const medInsert = await query.run('INSERT INTO medicines (name, description) VALUES (?, ?)', ['Paracetamol', 'Painkiller']);
  const medicineId = medInsert.id;
  console.log('Medicine inserted with ID:', medicineId);

  // 3. Insert batches
  // Batch A: Expiring next month (Soon)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const expiryA = nextMonth.toISOString().split('T')[0];

  // Batch B: Expiring in 1 year (Later)
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiryB = nextYear.toISOString().split('T')[0];

  await query.run(
    'INSERT INTO batches (medicine_id, batch_number, quantity, expiry_date) VALUES (?, ?, ?, ?)',
    [medicineId, 'BATCH-A', 5, expiryA]
  );
  await query.run(
    'INSERT INTO batches (medicine_id, batch_number, quantity, expiry_date) VALUES (?, ?, ?, ?)',
    [medicineId, 'BATCH-B', 10, expiryB]
  );
  console.log('Batches BATCH-A (qty: 5, expiry:', expiryA, ') and BATCH-B (qty: 10, expiry:', expiryB, ') inserted.');

  // 4. Run Dispense Logic (FEFO)
  const qtyToDispense = 7;
  const today = new Date().toISOString().split('T')[0];

  console.log(`Dispensing ${qtyToDispense} units...`);
  
  // Find medicine
  const medicine = await query.get('SELECT * FROM medicines WHERE name = ?', ['Paracetamol']);
  if (!medicine) throw new Error('Medicine not found');

  // Find active batches ordered by expiry
  const activeBatches = await query.all(
    'SELECT * FROM batches WHERE medicine_id = ? AND expiry_date > ? AND quantity > 0 ORDER BY expiry_date ASC',
    [medicine.id, today]
  );

  let remainingToDeduct = qtyToDispense;
  for (const batch of activeBatches) {
    if (remainingToDeduct <= 0) break;

    if (batch.quantity >= remainingToDeduct) {
      const newQty = batch.quantity - remainingToDeduct;
      await query.run('UPDATE batches SET quantity = ? WHERE id = ?', [newQty, batch.id]);
      console.log(`Deducted ${remainingToDeduct} from ${batch.batch_number}. New qty: ${newQty}`);
      remainingToDeduct = 0;
    } else {
      await query.run('UPDATE batches SET quantity = 0 WHERE id = ?', [batch.id]);
      console.log(`Deducted ${batch.quantity} from ${batch.batch_number}. New qty: 0`);
      remainingToDeduct -= batch.quantity;
    }
  }

  // 5. Verify database state
  const finalBatches = await query.all('SELECT * FROM batches ORDER BY batch_number ASC');
  const batchA = finalBatches.find(b => b.batch_number === 'BATCH-A');
  const batchB = finalBatches.find(b => b.batch_number === 'BATCH-B');

  console.log('Final Batch A Quantity:', batchA.quantity);
  console.log('Final Batch B Quantity:', batchB.quantity);

  if (batchA.quantity === 0 && batchB.quantity === 8) {
    console.log('TEST PASSED: FEFO logic successfully deducted stock!');
  } else {
    console.error('TEST FAILED: Incorrect final stock numbers.');
  }

  // Close and clean up
  db.close(() => {
    fs.unlinkSync(testDbPath);
    console.log('Test DB cleaned up.');
  });
}

runTest().catch(console.error);
