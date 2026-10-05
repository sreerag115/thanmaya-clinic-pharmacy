import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EditMedicineModal({ isOpen, medicine, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicine) {
      setName(medicine.name);
      setDescription(medicine.description || '');
      setLowStockThreshold(medicine.low_stock_threshold || 10);
      setPrice(medicine.price || 0.0);
      setError('');
    }
  }, [medicine]);

  if (!isOpen || !medicine) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Medicine name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      low_stock_threshold: parseInt(lowStockThreshold, 10),
      price: parseFloat(price) || 0.0
    };

    const success = await onSave(medicine.id, payload);
    if (success) {
      onClose();
    } else {
      setError('Failed to update medicine. The name might already be taken.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Medicine Details</h3>
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

            <div className="form-group">
              <label htmlFor="edit-med-name">Medicine Name *</label>
              <input
                id="edit-med-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-med-desc">Description</label>
              <textarea
                id="edit-med-desc"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-med-threshold">Low Stock Threshold</label>
                <input
                  id="edit-med-threshold"
                  type="number"
                  className="form-control"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-med-price">Price per Unit (₹)</label>
                <input
                  id="edit-med-price"
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
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
