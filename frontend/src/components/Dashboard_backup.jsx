import React from 'react';
import { Layers, CheckCircle, AlertTriangle, XCircle, Clock, Calendar } from 'lucide-react';

export default function Dashboard({ stats }) {
  return (
    <div className="dashboard-grid">
      <div className="stat-card primary">
        <div className="stat-icon-wrapper">
          <Layers size={24} />
        </div>
        <div className="stat-info">
          <h3>Total Medicines</h3>
          <div className="stat-number">{stats.totalMedicines || 0}</div>
        </div>
      </div>

      <div className="stat-card success">
        <div className="stat-icon-wrapper">
          <CheckCircle size={24} />
        </div>
        <div className="stat-info">
          <h3>In Stock</h3>
          <div className="stat-number">{stats.inStockCount || 0}</div>
        </div>
      </div>

      <div className="stat-card warning">
        <div className="stat-icon-wrapper">
          <AlertTriangle size={24} />
        </div>
        <div className="stat-info">
          <h3>Low Stock Alert</h3>
          <div className="stat-number">{stats.lowStockCount || 0}</div>
        </div>
      </div>

      <div className="stat-card danger">
        <div className="stat-icon-wrapper">
          <XCircle size={24} />
        </div>
        <div className="stat-info">
          <h3>Out of Stock</h3>
          <div className="stat-number">{stats.outOfStockCount || 0}</div>
        </div>
      </div>

      <div className="stat-card danger">
        <div className="stat-icon-wrapper">
          <Clock size={24} />
        </div>
        <div className="stat-info">
          <h3>Expired Batches</h3>
          <div className="stat-number" style={{ color: 'var(--danger-dark)' }}>
            {stats.expiredBatchesCount || 0}
          </div>
        </div>
      </div>

      <div className="stat-card amber">
        <div className="stat-icon-wrapper">
          <Calendar size={24} />
        </div>
        <div className="stat-info">
          <h3>Near Expiry (90d)</h3>
          <div className="stat-number" style={{ color: '#d97706' }}>
            {stats.nearExpiryBatchesCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
