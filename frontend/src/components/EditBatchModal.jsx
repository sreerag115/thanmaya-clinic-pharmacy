import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EditBatchModal({ isOpen, batch, onClose, onSave }) {
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    if (batch) {
      setBatchNumber(batch.batch_number);
      setQuantity(batch.quantity);
      setMfgDate(batch.manufacture_date || '');
      setExpiryDate(batch.expiry_date);
      setError('');
      setWarning('');
    }
  }, [batch]);

  useEffect(() => {
    setWarning('');
    if (expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (expiryDate <= today) {
        setWarning('Warning: Setting this batch expiry date in the past makes it expired.');
      } else {
        const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (expiryDate <= ninetyDays) {
          setWarning('Warning: This batch will expire within 90 days.');
        }
      }
    }
  }, [expiryDate]);

  if (!isOpen || !batch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!batchNumber.trim()) {
      setError('Batch number is required.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Quantity cannot be negative.');
      return;
    }
    if (!expiryDate) {
      setError('Expiry date is required.');
      return;
    }
    if (mfgDate && expiryDate && expiryDate < mfgDate) {
      setError('Expiry date cannot be before manufacture date.');
      return;
    }

    const payload = {
      batch_number: batchNumber.trim(),
      quantity: qty,
      manufacture_date: mfgDate,
      expiry_date: expiryDate
    };

    const success = await onSave(batch.id, payload);
    if (success) {
      onClose();
    } else {
      setError('Failed to update batch details.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Batch - {batch.medicine_name}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {warning && (
              <div className="alert alert-warning" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                <AlertTriangle size={18} />
                <span>{warning}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="edit-batch-num">Batch Number *</label>
              <input
                id="edit-batch-num"
                type="text"
                className="form-control"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-batch-qty">Quantity *</label>
              <input
                id="edit-batch-qty"
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-batch-mfg">Manufacture Date</label>
                <input
                  id="edit-batch-mfg"
                  type="date"
                  className="form-control"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-batch-expiry">Expiry Date *</label>
                <input
                  id="edit-batch-expiry"
                  type="date"
                  className="form-control"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
