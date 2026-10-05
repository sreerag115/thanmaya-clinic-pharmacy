import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AddStockForm({ medicines, onAddStock, successMessage, clearSuccessMessage }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [price, setPrice] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const wrapperRef = useRef(null);

  // Filter suggestions
  useEffect(() => {
    if (name.trim() === '') {
      setSuggestions([]);
      return;
    }
    const filtered = medicines.filter(med => 
      med.name.toLowerCase().includes(name.toLowerCase())
    );
    setSuggestions(filtered);
  }, [name, medicines]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Expiry check warning
  useEffect(() => {
    setWarning('');
    if (expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (expiryDate <= today) {
        setWarning('Warning: This medicine batch is expired!');
      } else {
        const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (expiryDate <= ninetyDays) {
          setWarning('Warning: This batch will expire within 90 days.');
        }
      }
    }
  }, [expiryDate]);

  const handleSelectMed = (med) => {
    setName(med.name);
    setDescription(med.description || '');
    setLowStockThreshold(med.low_stock_threshold || 10);
    setPrice(med.price || '');
    setShowSuggestions(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Medicine name is required.');
      return;
    }
    if (!batchNumber.trim()) {
      setError('Batch number is required.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Please enter a valid quantity (0 or more).');
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
      name: name.trim(),
      description: description.trim(),
      low_stock_threshold: parseInt(lowStockThreshold, 10),
      price: parseFloat(price) || 0.0,
      batch_number: batchNumber.trim(),
      quantity: qty,
      manufacture_date: mfgDate,
      expiry_date: expiryDate
    };

    const success = await onAddStock(payload);
    if (success) {
      // Clear inputs
      setName('');
      setDescription('');
      setLowStockThreshold(10);
      setPrice('');
      setBatchNumber('');
      setQuantity('');
      setMfgDate('');
      setExpiryDate('');
      setWarning('');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>
          <PlusCircle size={20} style={{ color: 'var(--primary)' }} /> Add / Receive Stock
        </h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
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

          {successMessage && (
            <div className="alert alert-success" style={{ padding: '0.75rem', marginBottom: '1.25rem', position: 'relative' }}>
              <CheckCircle size={18} />
              <span>{successMessage}</span>
              <button 
                type="button" 
                onClick={clearSuccessMessage} 
                style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success-dark)', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="form-group" ref={wrapperRef}>
            <label htmlFor="add-name">Medicine Name *</label>
            <div className="autocomplete-container">
              <input
                id="add-name"
                type="text"
                className="form-control"
                placeholder="Search or enter medicine name..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((med) => (
                    <li
                      key={med.id}
                      className="suggestion-item"
                      onClick={() => handleSelectMed(med)}
                    >
                      <span style={{ fontWeight: 600 }}>{med.name}</span>
                      <span style={{ float: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        (Existing: {med.active_quantity} in stock)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="add-description">Description</label>
            <textarea
              id="add-description"
              className="form-control"
              placeholder="e.g. Paracetamol 500mg, Painkiller..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="add-batch">Batch Number *</label>
              <input
                id="add-batch"
                type="text"
                className="form-control"
                placeholder="e.g. B24089"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-qty">Quantity *</label>
              <input
                id="add-qty"
                type="number"
                className="form-control"
                placeholder="e.g. 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="add-mfg">Manufacture Date</label>
              <input
                id="add-mfg"
                type="date"
                className="form-control"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-expiry">Expiry Date *</label>
              <input
                id="add-expiry"
                type="date"
                className="form-control"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="add-threshold">Low Stock Threshold</label>
              <input
                id="add-threshold"
                type="number"
                className="form-control"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-price">Price per Unit (₹) *</label>
              <input
                id="add-price"
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 5.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            Add to Inventory
          </button>
        </form>
      </div>
    </div>
  );
}
