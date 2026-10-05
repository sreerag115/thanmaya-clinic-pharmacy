const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../inventory.db');
const db = new sqlite3.Database(dbPath);

// Helper function to get dates relative to today
function getRelativeDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

db.serialize(() => {
  console.log('--- POPULATING THANMAYA INVENTORY DEMO DATA ---');

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Clear existing data to ensure a clean demo environment
  db.run('DELETE FROM batches');
  db.run('DELETE FROM medicines');
  db.run('DELETE FROM sqlite_sequence WHERE name IN ("medicines", "batches")');
  console.log('Cleared existing inventory tables.');

  // Define mock medicines
  const medicines = [
    // 1. Available (In Stock & Good Expiry)
    { name: 'Paracetamol 650mg', description: 'Pain and fever reducer', low_stock_threshold: 10, price: 2.00,
      batches: [{ batch_number: 'PM-101', quantity: 150, manufacture_date: getRelativeDate(-90), expiry_date: getRelativeDate(365) }] },
    { name: 'Cetirizine 10mg', description: 'Antihistamine / Allergy relief', low_stock_threshold: 15, price: 1.50,
      batches: [{ batch_number: 'CT-202', quantity: 200, manufacture_date: getRelativeDate(-60), expiry_date: getRelativeDate(500) }] },
    { name: 'Metformin 500mg', description: 'Anti-diabetic medicine', low_stock_threshold: 20, price: 4.50,
      batches: [{ batch_number: 'MF-303', quantity: 120, manufacture_date: getRelativeDate(-120), expiry_date: getRelativeDate(730) }] },

    // 2. Low Stock (Active quantity is low but unexpired)
    { name: 'Amoxicillin 500mg', description: 'Antibiotic capsule', low_stock_threshold: 15, price: 8.00,
      batches: [{ batch_number: 'AMX-505', quantity: 8, manufacture_date: getRelativeDate(-45), expiry_date: getRelativeDate(200) }] },
    { name: 'Atorvastatin 10mg', description: 'Cholesterol lowering drug', low_stock_threshold: 10, price: 12.00,
      batches: [{ batch_number: 'AT-808', quantity: 5, manufacture_date: getRelativeDate(-30), expiry_date: getRelativeDate(300) }] },

    // 3. Out of Stock (Quantity is 0)
    { name: 'Ibuprofen 400mg', description: 'NSAID / Painkiller', low_stock_threshold: 10, price: 3.00,
      batches: [{ batch_number: 'IBU-404', quantity: 0, manufacture_date: getRelativeDate(-180), expiry_date: getRelativeDate(90) }] },
    { name: 'Pantoprazole 40mg', description: 'Acidity relief (PPI)', low_stock_threshold: 15, price: 7.50,
      batches: [{ batch_number: 'PT-909', quantity: 0, manufacture_date: getRelativeDate(-150), expiry_date: getRelativeDate(250) }] },

    // 4. Expired (Quantity > 0, Expiry date is in the past)
    { name: 'Cough Syrup (Ascoril)', description: 'Bronchodilator cough syrup', low_stock_threshold: 10, price: 85.00,
      batches: [{ batch_number: 'CS-911', quantity: 15, manufacture_date: getRelativeDate(-365), expiry_date: getRelativeDate(-45) }] },
    { name: 'Azithromycin 500mg', description: 'Broad-spectrum antibiotic', low_stock_threshold: 8, price: 22.00,
      batches: [{ batch_number: 'AZ-606', quantity: 20, manufacture_date: getRelativeDate(-250), expiry_date: getRelativeDate(-15) }] },

    // 5. Near Expiry (Draining soon - within 90 days)
    { name: 'Amlodipine 5mg', description: 'Blood pressure control', low_stock_threshold: 10, price: 3.50,
      batches: [{ batch_number: 'AL-707', quantity: 80, manufacture_date: getRelativeDate(-180), expiry_date: getRelativeDate(30) }] },
    { name: 'Vitamin C (Limcee)', description: 'Chewable Vitamin C tablets', low_stock_threshold: 25, price: 1.80,
      batches: [{ batch_number: 'VC-112', quantity: 300, manufacture_date: getRelativeDate(-90), expiry_date: getRelativeDate(45) }] }
  ];

  // Insert loop
  let medicinesInserted = 0;
  let batchesInserted = 0;

  medicines.forEach((med) => {
    db.run(
      'INSERT INTO medicines (name, description, low_stock_threshold, price) VALUES (?, ?, ?, ?)',
      [med.name, med.description, med.low_stock_threshold, med.price],
      function(err) {
        if (err) {
          console.error(`Error inserting medicine ${med.name}:`, err.message);
          return;
        }

        const medId = this.lastID;
        medicinesInserted++;

        med.batches.forEach((b) => {
          db.run(
            'INSERT INTO batches (medicine_id, batch_number, quantity, manufacture_date, expiry_date) VALUES (?, ?, ?, ?, ?)',
            [medId, b.batch_number, b.quantity, b.manufacture_date, b.expiry_date],
            function(batchErr) {
              if (batchErr) {
                console.error(`Error inserting batch ${b.batch_number} for ${med.name}:`, batchErr.message);
              } else {
                batchesInserted++;
              }

              // Check if completed
              if (medicinesInserted === medicines.length && batchesInserted === medicines.reduce((sum, m) => sum + m.batches.length, 0)) {
                console.log(`Successfully populated ${medicinesInserted} medicines and ${batchesInserted} batches.`);
                db.close(() => {
                  console.log('Database connection closed. Demo data ready!');
                });
              }
            }
          );
        });
      }
    );
  });
});
