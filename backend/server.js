const express = require('express');
const path = require('path');
const cors = require('cors');
const { query } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 1. GET /api/dashboard - Summary stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const today = getTodayDateString();
    
    // Total medicines profiles
    const medicinesCountRes = await query.get('SELECT COUNT(*) AS count FROM medicines');
    const totalMedicines = medicinesCountRes.count;

    // Fetch all medicines with their batch quantities summed
    // Separate active stock (unexpired) and expired stock
    const medicines = await query.all('SELECT * FROM medicines');
    const batches = await query.all('SELECT * FROM batches');

    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredBatchesCount = 0;
    let nearExpiryBatchesCount = 0;
    
    const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Compute stats
    medicines.forEach(med => {
      const medBatches = batches.filter(b => b.medicine_id === med.id);
      
      // Active quantity = quantity in unexpired batches
      const activeQuantity = medBatches
        .filter(b => b.expiry_date > today)
        .reduce((sum, b) => sum + b.quantity, 0);

      if (activeQuantity === 0) {
        outOfStockCount++;
      } else if (activeQuantity <= med.low_stock_threshold) {
        lowStockCount++;
        inStockCount++;
      } else {
        inStockCount++;
      }
    });

    // Count batches that are expired and have stock > 0
    batches.forEach(b => {
      if (b.quantity > 0) {
        if (b.expiry_date <= today) {
          expiredBatchesCount++;
        } else if (b.expiry_date <= ninetyDaysLater) {
          nearExpiryBatchesCount++;
        }
      }
    });

    res.json({
      totalMedicines,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      expiredBatchesCount,
      nearExpiryBatchesCount
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /api/medicines - Get all medicines with their batches
app.get('/api/medicines', async (req, res) => {
  try {
    const today = getTodayDateString();
    const medicines = await query.all('SELECT * FROM medicines ORDER BY name ASC');
    const batches = await query.all('SELECT * FROM batches ORDER BY expiry_date ASC');

    const result = medicines.map(med => {
      const medBatches = batches.filter(b => b.medicine_id === med.id);
      
      const activeQuantity = medBatches
        .filter(b => b.expiry_date > today)
        .reduce((sum, b) => sum + b.quantity, 0);

      const expiredQuantity = medBatches
        .filter(b => b.expiry_date <= today)
        .reduce((sum, b) => sum + b.quantity, 0);

      // Determine status
      let status = 'Available';
      if (activeQuantity === 0) {
        status = 'Out of Stock';
      } else if (activeQuantity <= med.low_stock_threshold) {
        status = 'Low Stock';
      }

      // Format batches
      const formattedBatches = medBatches.map(b => ({
        id: b.id,
        batch_number: b.batch_number,
        quantity: b.quantity,
        manufacture_date: b.manufacture_date,
        expiry_date: b.expiry_date,
        is_expired: b.expiry_date <= today,
        is_near_expiry: b.expiry_date > today && b.expiry_date <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      return {
        id: med.id,
        name: med.name,
        description: med.description,
        low_stock_threshold: med.low_stock_threshold,
        price: med.price || 0.0,
        active_quantity: activeQuantity,
        expired_quantity: expiredQuantity,
        total_quantity: activeQuantity + expiredQuantity,
        status,
        batches: formattedBatches
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. POST /api/medicines - Add a new medicine / stock batch
app.post('/api/medicines', async (req, res) => {
  const {
    name,
    description = '',
    low_stock_threshold = 10,
    price = 0.0,
    batch_number,
    quantity,
    manufacture_date = '',
    expiry_date
  } = req.body;

  if (!name || !batch_number || quantity === undefined || !expiry_date) {
    return res.status(400).json({ error: 'Medicine name, batch number, quantity, and expiry date are required.' });
  }

  if (quantity < 0) {
    return res.status(400).json({ error: 'Quantity cannot be negative.' });
  }

  try {
    const result = await query.transaction(async () => {
      // Find or create medicine
      let medicine = await query.get('SELECT * FROM medicines WHERE LOWER(name) = LOWER(?)', [name.trim()]);
      let medicineId;

      if (!medicine) {
        const insertMed = await query.run(
          'INSERT INTO medicines (name, description, low_stock_threshold, price) VALUES (?, ?, ?, ?)',
          [name.trim(), description.trim(), low_stock_threshold, parseFloat(price) || 0.0]
        );
        medicineId = insertMed.id;
      } else {
        medicineId = medicine.id;
        // Update description, low stock threshold and price
        await query.run(
          'UPDATE medicines SET description = COALESCE(NULLIF(?, ""), description), low_stock_threshold = ?, price = ? WHERE id = ?',
          [description.trim(), low_stock_threshold, parseFloat(price) || 0.0, medicineId]
        );
      }

      // Check if batch number already exists for this medicine
      const existingBatch = await query.get(
        'SELECT * FROM batches WHERE medicine_id = ? AND batch_number = ?',
        [medicineId, batch_number.trim()]
      );

      if (existingBatch) {
        // Top up existing batch quantity
        const newQty = existingBatch.quantity + parseInt(quantity, 10);
        await query.run(
          'UPDATE batches SET quantity = ?, manufacture_date = ?, expiry_date = ? WHERE id = ?',
          [newQty, manufacture_date || existingBatch.manufacture_date, expiry_date, existingBatch.id]
        );
        return { message: 'Stock topped up successfully.', medicineId, batchId: existingBatch.id, addedToExisting: true };
      } else {
        // Insert new batch
        const insertBatch = await query.run(
          'INSERT INTO batches (medicine_id, batch_number, quantity, manufacture_date, expiry_date) VALUES (?, ?, ?, ?, ?)',
          [medicineId, batch_number.trim(), quantity, manufacture_date, expiry_date]
        );
        return { message: 'New stock batch added successfully.', medicineId, batchId: insertBatch.id, addedToExisting: false };
      }
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// 4. POST /api/medicines/dispense - FEFO dispensing
app.post('/api/medicines/dispense', async (req, res) => {
  const { name, quantity } = req.body;
  const qtyToDispense = parseInt(quantity, 10);

  if (!name || isNaN(qtyToDispense) || qtyToDispense <= 0) {
    return res.status(400).json({ error: 'Valid medicine name and positive quantity to dispense are required.' });
  }

  try {
    const today = getTodayDateString();

    const result = await query.transaction(async () => {
      // Find medicine (case-insensitive)
      const medicine = await query.get('SELECT * FROM medicines WHERE LOWER(name) = LOWER(?)', [name.trim()]);
      if (!medicine) {
        throw new Error('Medicine not found.');
      }

      // Find all unexpired batches of this medicine with stock, ordered by expiry date ASC (soonest to expire first)
      const activeBatches = await query.all(
        'SELECT * FROM batches WHERE medicine_id = ? AND expiry_date > ? AND quantity > 0 ORDER BY expiry_date ASC',
        [medicine.id, today]
      );

      const totalActiveQty = activeBatches.reduce((sum, b) => sum + b.quantity, 0);

      if (totalActiveQty < qtyToDispense) {
        throw new Error(`Insufficient stock. Only ${totalActiveQty} units are available in unexpired batches.`);
      }

      let remainingToDeduct = qtyToDispense;
      const deductions = [];

      for (const batch of activeBatches) {
        if (remainingToDeduct <= 0) break;

        if (batch.quantity >= remainingToDeduct) {
          const newQty = batch.quantity - remainingToDeduct;
          await query.run('UPDATE batches SET quantity = ? WHERE id = ?', [newQty, batch.id]);
          deductions.push({ batch_id: batch.id, batch_number: batch.batch_number, deducted: remainingToDeduct, remaining: newQty });
          remainingToDeduct = 0;
        } else {
          // Deduct all from this batch
          await query.run('UPDATE batches SET quantity = 0 WHERE id = ?', [batch.id]);
          deductions.push({ batch_id: batch.id, batch_number: batch.batch_number, deducted: batch.quantity, remaining: 0 });
          remainingToDeduct -= batch.quantity;
        }
      }

      return {
        message: 'Medicine dispensed successfully.',
        medicine_name: medicine.name,
        description: medicine.description || '',
        price: medicine.price || 0.0,
        dispensed_quantity: qtyToDispense,
        deductions
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error dispensing medicine:', error.message);
    res.status(error.message === 'Medicine not found.' ? 404 : 400).json({ error: error.message });
  }
});

// 4b. POST /api/medicines/dispense/bulk - Bulk FEFO dispensing
app.post('/api/medicines/dispense/bulk', async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'List of items to dispense is required.' });
  }

  try {
    const today = getTodayDateString();

    const result = await query.transaction(async () => {
      const dispensedItems = [];
      let grandTotal = 0;

      for (const item of items) {
        const { name, quantity } = item;
        const qtyToDispense = parseInt(quantity, 10);

        if (!name || isNaN(qtyToDispense) || qtyToDispense <= 0) {
          throw new Error(`Invalid item: ${name || 'unknown'}. Valid name and positive quantity required.`);
        }

        // Find medicine (case-insensitive)
        const medicine = await query.get('SELECT * FROM medicines WHERE LOWER(name) = LOWER(?)', [name.trim()]);
        if (!medicine) {
          throw new Error(`Medicine not found: ${name}`);
        }

        // Find all unexpired batches with stock, ordered by expiry date ASC
        const activeBatches = await query.all(
          'SELECT * FROM batches WHERE medicine_id = ? AND expiry_date > ? AND quantity > 0 ORDER BY expiry_date ASC',
          [medicine.id, today]
        );

        const totalActiveQty = activeBatches.reduce((sum, b) => sum + b.quantity, 0);

        if (totalActiveQty < qtyToDispense) {
          throw new Error(`Insufficient stock for ${medicine.name}. Available: ${totalActiveQty}, Requested: ${qtyToDispense}`);
        }

        let remainingToDeduct = qtyToDispense;
        const deductions = [];

        for (const batch of activeBatches) {
          if (remainingToDeduct <= 0) break;

          if (batch.quantity >= remainingToDeduct) {
            const newQty = batch.quantity - remainingToDeduct;
            await query.run('UPDATE batches SET quantity = ? WHERE id = ?', [newQty, batch.id]);
            deductions.push({ batch_id: batch.id, batch_number: batch.batch_number, deducted: remainingToDeduct, remaining: newQty });
            remainingToDeduct = 0;
          } else {
            await query.run('UPDATE batches SET quantity = 0 WHERE id = ?', [batch.id]);
            deductions.push({ batch_id: batch.id, batch_number: batch.batch_number, deducted: batch.quantity, remaining: 0 });
            remainingToDeduct -= batch.quantity;
          }
        }

        const subtotal = qtyToDispense * (medicine.price || 0.0);
        grandTotal += subtotal;

        dispensedItems.push({
          medicine_name: medicine.name,
          description: medicine.description || '',
          price: medicine.price || 0.0,
          dispensed_quantity: qtyToDispense,
          subtotal,
          deductions
        });
      }

      return {
        message: 'Bulk dispensing completed successfully.',
        items: dispensedItems,
        grand_total: grandTotal
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error in bulk dispensing:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// 5. PUT /api/medicines/:id - Edit medicine info
app.put('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, low_stock_threshold, price } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Medicine name is required.' });
  }

  try {
    // Check if name is already taken by another medicine
    const duplicate = await query.get(
      'SELECT * FROM medicines WHERE LOWER(name) = LOWER(?) AND id != ?',
      [name.trim(), id]
    );

    if (duplicate) {
      return res.status(400).json({ error: 'Another medicine with this name already exists.' });
    }

    await query.run(
      'UPDATE medicines SET name = ?, description = ?, low_stock_threshold = ?, price = ? WHERE id = ?',
      [name.trim(), description || '', low_stock_threshold || 10, parseFloat(price) || 0.0, id]
    );

    res.json({ message: 'Medicine updated successfully.' });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. PUT /api/batches/:id - Edit batch info
app.put('/api/batches/:id', async (req, res) => {
  const { id } = req.params;
  const { batch_number, quantity, manufacture_date, expiry_date } = req.body;

  if (!batch_number || quantity === undefined || !expiry_date) {
    return res.status(400).json({ error: 'Batch number, quantity, and expiry date are required.' });
  }

  if (quantity < 0) {
    return res.status(400).json({ error: 'Quantity cannot be negative.' });
  }

  try {
    await query.run(
      'UPDATE batches SET batch_number = ?, quantity = ?, manufacture_date = ?, expiry_date = ? WHERE id = ?',
      [batch_number.trim(), quantity, manufacture_date || '', expiry_date, id]
    );

    res.json({ message: 'Batch updated successfully.' });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. DELETE /api/batches/:id - Delete a specific batch
app.delete('/api/batches/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await query.run('DELETE FROM batches WHERE id = ?', [id]);
    res.json({ message: 'Batch deleted successfully.' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. DELETE /api/medicines/:id - Delete medicine and all its batches
app.delete('/api/medicines/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await query.run('DELETE FROM medicines WHERE id = ?', [id]);
    res.json({ message: 'Medicine and all its batches deleted successfully.' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend in production (compiled static assets)
const fs = require('fs');
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running offline on port ${PORT}`);
});
