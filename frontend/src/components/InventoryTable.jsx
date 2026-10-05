import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function InventoryTable({
  medicines,
  onEditMedicine,
  onDeleteMedicine,
  onEditBatch,
  onDeleteBatch
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedMedIds, setExpandedMedIds] = useState({});

  const toggleExpand = (id) => {
    setExpandedMedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter and search logic
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.description && med.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      med.batches.some(b => b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'All') return true;
    if (filterStatus === 'Available') return med.status === 'Available';
    if (filterStatus === 'Low Stock') return med.status === 'Low Stock';
    if (filterStatus === 'Out of Stock') return med.status === 'Out of Stock';
    if (filterStatus === 'Expired') {
      // Medicine has at least one expired batch with stock > 0
      return med.batches.some(b => b.is_expired && b.quantity > 0);
    }
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2>Medicine Inventory</h2>
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
          Showing {filteredMedicines.length} of {medicines.length} items
        </span>
      </div>
      <div className="card-body" style={{ padding: '1.25rem' }}>
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, description, or batch #..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="filterStatus" style={{ marginRight: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
              Status:
            </label>
            <select
              id="filterStatus"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Expired">Has Expired Stock</option>
            </select>
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert size={40} className="empty-state-icon" />
            <p>No medicines found matching the criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="med-table">
              <thead>
                <tr>
                  <th width="40"></th>
                  <th>Medicine Name</th>
                  <th>Description</th>
                  <th>Price (Unit)</th>
                  <th>Available Quantity</th>
                  <th>Status</th>
                  <th>Total Batches</th>
                  <th width="100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((med) => {
                  const isExpanded = !!expandedMedIds[med.id];
                  
                  // Status badge styling
                  let badgeClass = 'badge-success';
                  if (med.status === 'Out of Stock') badgeClass = 'badge-danger';
                  if (med.status === 'Low Stock') badgeClass = 'badge-warning';

                  // Count of expired and near-expiry batches in this medicine
                  const expiredCount = med.batches.filter(b => b.is_expired && b.quantity > 0).length;
                  const nearExpiryCount = med.batches.filter(b => b.is_near_expiry && b.quantity > 0).length;

                  return (
                    <React.Fragment key={med.id}>
                      <tr
                        className={`med-row ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(med.id)}
                      >
                        <td>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {med.name}
                            {expiredCount > 0 && (
                              <span
                                className="batch-expired-badge"
                                title={`${expiredCount} batch(es) expired`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Expired ({expiredCount})
                              </span>
                            )}
                            {nearExpiryCount > 0 && expiredCount === 0 && (
                              <span
                                className="batch-near-badge"
                                title={`${nearExpiryCount} batch(es) expiring soon`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Expiring Soon
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{med.description || '—'}</td>
                        <td style={{ fontWeight: 500 }}>₹{(med.price || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>{med.active_quantity} units</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{med.status}</span>
                        </td>
                        <td>{med.batches.length} batches</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Edit Medicine"
                              onClick={() => onEditMedicine(med)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Delete Medicine"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${med.name} and all its batches?`)) {
                                  onDeleteMedicine(med.id);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="batches-details-row">
                          <td colSpan="8">
                            <div className="batches-card">
                              <div className="batches-title">
                                <Calendar size={16} /> Batch details for {med.name}
                              </div>
                              {med.batches.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                  No batches added yet.
                                </p>
                              ) : (
                                <table className="batch-table">
                                  <thead>
                                    <tr>
                                      <th>Batch #</th>
                                      <th>Current Qty</th>
                                      <th>Mfg. Date</th>
                                      <th>Expiry Date</th>
                                      <th>Status</th>
                                      <th width="80">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {med.batches.map((batch) => {
                                      let rowClass = '';
                                      let batchStatus = 'Active';

                                      if (batch.is_expired) {
                                        rowClass = 'batch-row-expired';
                                        batchStatus = 'Expired';
                                      } else if (batch.is_near_expiry) {
                                        rowClass = 'batch-row-near';
                                        batchStatus = 'Expiring Soon';
                                      }

                                      return (
                                        <tr key={batch.id} className={rowClass}>
                                          <td style={{ fontWeight: 500 }}>{batch.batch_number}</td>
                                          <td>{batch.quantity} units</td>
                                          <td>{batch.manufacture_date || '—'}</td>
                                          <td style={{ fontWeight: batch.is_expired ? 600 : 'normal' }}>
                                            {batch.expiry_date}
                                          </td>
                                          <td>
                                            {batch.is_expired && (
                                              <span className="batch-expired-badge">Expired</span>
                                            )}
                                            {batch.is_near_expiry && (
                                              <span className="batch-near-badge">Expiring Soon</span>
                                            )}
                                            {!batch.is_expired && !batch.is_near_expiry && (
                                              <span style={{ color: 'var(--success-dark)' }}>Good</span>
                                            )}
                                          </td>
                                          <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                              <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '0.2rem 0.4rem' }}
                                                title="Edit Batch"
                                                onClick={() => onEditBatch({ ...batch, medicine_name: med.name })}
                                              >
                                                <Edit2 size={12} />
                                              </button>
                                              <button
                                                className="btn btn-danger btn-sm"
                                                style={{ padding: '0.2rem 0.4rem' }}
                                                title="Delete Batch"
                                                onClick={() => {
                                                  if (window.confirm(`Delete batch ${batch.batch_number}?`)) {
                                                    onDeleteBatch(batch.id);
                                                  }
                                                }}
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
