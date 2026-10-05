import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, CheckCircle, AlertTriangle, X, Printer, Download, Plus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function DispenseForm({ medicines, onDispense, onBulkDispense, dispenseResult, clearDispenseResult }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [patientName, setPatientName] = useState('');
  const [lastPatientName, setLastPatientName] = useState('');
  const [cart, setCart] = useState([]);
  
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Generate a random invoice ID for the bill display
  const [invoiceId, setInvoiceId] = useState('');

  useEffect(() => {
    if (dispenseResult) {
      setInvoiceId(`INV-${Date.now().toString().slice(-6)}`);
    }
  }, [dispenseResult]);

  // Filter suggestions as name changes
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

  // Click outside listener to close suggestions
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

  // Handle select suggestion
  const handleSelectMed = (med) => {
    setName(med.name);
    setSelectedMed(med);
    setShowSuggestions(false);
    setError('');
  };

  // Add item to temporary billing cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please select a medicine.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than zero.');
      return;
    }

    // Verify medicine exists
    const match = medicines.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
    if (!match) {
      setError('Medicine does not exist in inventory.');
      return;
    }

    // Calculate how many are already in the cart for this medicine
    const existingCartItem = cart.find(item => item.name.toLowerCase() === name.trim().toLowerCase());
    const cartQty = existingCartItem ? existingCartItem.quantity : 0;
    const totalRequestedQty = qty + cartQty;

    if (match.active_quantity < totalRequestedQty) {
      setError(`Insufficient stock. Only ${match.active_quantity} units available. (Already in cart: ${cartQty})`);
      return;
    }

    if (existingCartItem) {
      // Update quantity of existing cart item
      setCart(cart.map(item => 
        item.name.toLowerCase() === name.trim().toLowerCase()
          ? { ...item, quantity: totalRequestedQty }
          : item
      ));
    } else {
      // Add new item to cart
      setCart([...cart, {
        medicine_id: match.id,
        name: match.name,
        description: match.description || '',
        quantity: qty,
        price: match.price || 0.0,
        active_quantity: match.active_quantity
      }]);
    }

    // Clear item inputs for next selection
    setName('');
    setQuantity('');
    setSelectedMed(null);
  };

  // Remove item from cart
  const handleRemoveFromCart = (indexToRemove) => {
    setCart(cart.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Bulk Checkout / Dispense
  const handleCheckout = async () => {
    setError('');
    
    if (cart.length === 0) {
      setError('Your billing cart is empty.');
      return;
    }

    setLastPatientName(patientName.trim());
    
    const itemsPayload = cart.map(item => ({
      name: item.name,
      quantity: item.quantity
    }));

    const success = await onBulkDispense(itemsPayload);
    if (success) {
      // Reset cart and checkout details on success
      setCart([]);
      setPatientName('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!dispenseResult || !dispenseResult.items) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const billDate = new Date().toLocaleString();
    const pName = lastPatientName || 'Walk-in Customer';

    // Header styling
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136); // Teal color
    doc.text("THANMAYA CLINIC", 15, 20);

    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Pharmacy Inventory & Billing System", 15, 25);
    doc.text("Offline System", 15, 29);

    // Divider line
    doc.setDrawColor(200);
    doc.line(15, 34, 133, 34);

    // Invoice Metadata
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(40);
    doc.text(`Invoice No: ${invoiceId}`, 15, 42);
    doc.setFont("Helvetica", "normal");
    doc.text(`Date: ${billDate}`, 15, 47);
    doc.text(`Patient Name: ${pName}`, 15, 52);

    // Divider
    doc.line(15, 57, 133, 57);

    // Table Columns
    doc.setFont("Helvetica", "bold");
    doc.text("Medicine & Description", 15, 64);
    doc.text("Qty", 82, 64);
    doc.text("Price", 97, 64);
    doc.text("Total (INR)", 112, 64);

    doc.line(15, 67, 133, 67);

    // Loop through invoice items and draw them
    let y = 74;
    doc.setFont("Helvetica", "normal");
    
    dispenseResult.items.forEach((item) => {
      // Check if page height exceeded (for safety, though A5 can fit many items)
      if (y > 185) {
        doc.addPage();
        y = 20; // reset y on new page
      }

      doc.setFont("Helvetica", "bold");
      doc.text(item.medicine_name, 15, y);
      doc.setFont("Helvetica", "normal");
      doc.text(String(item.dispensed_quantity), 82, y);
      doc.text(`Rs.${item.price.toFixed(2)}`, 97, y);
      doc.text(`Rs.${item.subtotal.toFixed(2)}`, 112, y);

      // Description subtext
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(item.description.substring(0, 50), 15, y + 4);

      // Reset styles for next row
      doc.setFontSize(9);
      doc.setTextColor(40);
      y += 10; // Increment vertical offset
    });

    doc.setDrawColor(200);
    doc.line(15, y - 5, 133, y - 5);

    // Grand total
    doc.setFont("Helvetica", "bold");
    doc.text("Grand Total:", 82, y + 2);
    doc.text(`Rs.${dispenseResult.grand_total.toFixed(2)}`, 112, y + 2);

    // Footer
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Thank you! Keep this copy for your records.", 15, y + 20);
    doc.text("System Generated Invoice - Offline", 15, y + 24);

    doc.save(`invoice-${invoiceId}.pdf`);
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="card">
      <div className="card-header no-print">
        <h2>
          <ShoppingBag size={20} style={{ color: 'var(--primary)' }} /> Dispense & Billing Cart
        </h2>
      </div>
      <div className="card-body">
        
        {/* Printable/Display Multi-Item Invoice */}
        {dispenseResult && dispenseResult.items && (
          <div className="print-bill-container" style={{ marginBottom: '1.5rem', animation: 'slideUp 0.3s ease-out' }}>
            <div className="invoice-receipt" style={{ border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#fff', position: 'relative' }}>
              <button 
                type="button" 
                onClick={clearDispenseResult} 
                className="modal-close no-print"
                style={{ position: 'absolute', right: '15px', top: '15px' }}
                title="Close Receipt"
              >
                &times;
              </button>
              
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--primary-dark)', fontWeight: 'bold' }}>THANMAYA CLINIC</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pharmacy Inventory & Billing System</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>Offline POS Terminal</div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }} />

              {/* Invoice Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.825rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                <div><strong>Invoice ID:</strong> {invoiceId}</div>
                <div style={{ textAlign: 'right' }}><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Patient Name:</strong> {lastPatientName || 'Walk-in Customer'}</div>
                <div style={{ textAlign: 'right' }}><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--text-main)', textAlign: 'left', fontWeight: 'bold' }}>
                    <th style={{ padding: '0.5rem 0' }}>Item Details</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dispenseResult.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                      <td style={{ padding: '0.6rem 0' }}>
                        <div style={{ fontWeight: 600 }}>{item.medicine_name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{item.description || 'No description'}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0', textAlign: 'center' }}>{item.dispensed_quantity}</td>
                      <td style={{ padding: '0.6rem 0', textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                      <td style={{ padding: '0.6rem 0', textAlign: 'right' }}>₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Section */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1rem', fontWeight: 'bold', borderTop: '1px solid var(--text-main)', paddingTop: '0.5rem' }}>
                <div>Grand Total: ₹{dispenseResult.grand_total.toFixed(2)}</div>
              </div>

              {/* Batch Deductions details */}
              <div className="no-print" style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>FEFO Stock Deductions:</span>
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {dispenseResult.items.flatMap(item => item.deductions).map((d, idx) => (
                    <li key={idx}>• Batch <strong>{d.batch_number}</strong>: -{d.deducted} units</li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handlePrint}
                >
                  <Printer size={16} /> Print Bill
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleDownloadPDF}
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="no-print dispense-layout-grid">
          {/* Add Item Form */}
          <div className="dispense-form-col">
            <form onSubmit={handleAddToCart} style={{ backgroundColor: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Add Medicine to Bill:</h4>
              
              {error && (
                <div className="alert alert-danger" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group" ref={wrapperRef} style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="dispense-med-name" style={{ fontSize: '0.8rem' }}>Medicine Name</label>
                <div className="autocomplete-container">
                  <input
                    id="dispense-med-name"
                    type="text"
                    className="form-control"
                    placeholder="Search medicine (e.g. Paracetamol)..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSelectedMed(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
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
                          <span style={{ float: 'right', fontSize: '0.8rem', color: med.active_quantity === 0 ? 'var(--danger-dark)' : 'var(--text-muted)' }}>
                            {med.active_quantity === 0 ? 'Out of Stock' : `₹${med.price.toFixed(2)} (${med.active_quantity} avail)`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {selectedMed && (
                <div 
                  style={{
                    backgroundColor: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.75rem',
                    borderLeft: `4px solid ${selectedMed.active_quantity === 0 ? 'var(--danger)' : 'var(--primary)'}`,
                    borderRight: '1px solid var(--border-color)',
                    borderTop: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{selectedMed.name}</span>
                    <span className={`badge ${selectedMed.active_quantity === 0 ? 'badge-danger' : selectedMed.active_quantity <= selectedMed.low_stock_threshold ? 'badge-warning' : 'badge-success'}`} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                      {selectedMed.active_quantity === 0 ? 'Out of Stock' : `${selectedMed.active_quantity} Avail`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Price per unit:</span>
                    <strong>₹{selectedMed.price.toFixed(2)}</strong>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="dispense-qty" style={{ fontSize: '0.8rem' }}>Quantity to Take</label>
                <input
                  id="dispense-qty"
                  type="number"
                  className="form-control"
                  placeholder="Enter quantity..."
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={selectedMed ? selectedMed.active_quantity : undefined}
                  disabled={selectedMed && selectedMed.active_quantity === 0}
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!name || !quantity || (selectedMed && selectedMed.active_quantity === 0)}
              >
                <Plus size={14} /> Add Medicine
              </button>
            </form>
          </div>

          {/* Current Bill Cart List */}
          <div className="dispense-cart-col">
            <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark)' }}>
              Current Bill List ({cart.length} items):
            </h4>

            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', padding: '2.5rem 1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                No medicines added to the bill yet. Select a medicine on the left to get started.
              </p>
            ) : (
              <>
                <div className="table-container" style={{ marginBottom: '1.25rem' }}>
                  <table className="med-table" style={{ fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th width="50"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price.toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>₹{(item.quantity * item.price).toFixed(2)}</td>
                          <td>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm" 
                              style={{ padding: '0.2rem' }}
                              onClick={() => handleRemoveFromCart(idx)}
                              title="Remove item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Checkout Controls */}
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="patient-name">Patient Name (Optional)</label>
                    <input
                      id="patient-name"
                      type="text"
                      className="form-control"
                      placeholder="Enter patient name..."
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Grand Total:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleCheckout}
                  >
                    Generate Bill & Dispense
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
