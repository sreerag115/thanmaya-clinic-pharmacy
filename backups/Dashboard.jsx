import React from 'react';
import { Layers, CheckCircle, AlertTriangle, XCircle, Clock, Calendar, HeartPulse, Activity, ShieldAlert } from 'lucide-react';

export default function Dashboard({ stats }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate alerts
  const hasExpired = (stats.expiredBatchesCount || 0) > 0;
  const hasLowStock = (stats.lowStockCount || 0) > 0;
  const hasNearExpiry = (stats.nearExpiryBatchesCount || 0) > 0;
  const isHealthy = !hasExpired && !hasLowStock && !hasNearExpiry;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '2.5rem' }}>
      
      {/* 1. Hero Welcome Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <HeartPulse size={20} style={{ color: '#99f6e4' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ccfbf1' }}>
              Thanmaya Clinic Portal
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Pharmacy Dashboard
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#ccfbf1', marginTop: '0.25rem', maxWidth: '500px' }}>
            Real-time quantity tracking, drug expiry alerts, and patient checkout console.
          </p>
        </div>
        
        {/* Date and Database Status Widget */}
        <div 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            minWidth: '220px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#ccfbf1', textTransform: 'uppercase', fontWeight: 600 }}>System Date</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.1rem 0 0.5rem 0' }}>{today}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            SQLite Database Connected
          </div>
        </div>
      </div>

      {/* 2. Headline Title */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', margin: 0 }}>
          <Activity size={18} style={{ color: 'var(--primary)' }} /> Inventory Summary
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>Real-time stock summaries and expiry reports</p>
      </div>

      {/* 3. Stat Cards Section */}
      <div className="dashboard-grid" style={{ marginBottom: 0 }}>
        {/* Total Medicines */}
        <div className="stat-card primary">
          <div className="stat-icon-wrapper">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Medicines</h3>
            <div className="stat-number">{stats.totalMedicines || 0}</div>
          </div>
        </div>

        {/* In Stock */}
        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>In Stock</h3>
            <div className="stat-number">{stats.inStockCount || 0}</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="stat-card danger">
          <div className="stat-icon-wrapper">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Out of Stock</h3>
            <div className="stat-number">{stats.outOfStockCount || 0}</div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="stat-card warning" style={{ borderLeft: '4px solid var(--warning)', boxShadow: hasLowStock ? '0 0 10px rgba(245, 158, 11, 0.1)' : 'none' }}>
          <div className="stat-icon-wrapper">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>Low Stock</h3>
            <div className="stat-number">{stats.lowStockCount || 0}</div>
          </div>
        </div>

        {/* Expired Batches */}
        <div className="stat-card danger" style={{ borderLeft: '4px solid var(--danger)', boxShadow: hasExpired ? '0 0 10px rgba(239, 68, 68, 0.1)' : 'none' }}>
          <div className="stat-icon-wrapper">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>Expired Batches</h3>
            <div className="stat-number" style={{ color: 'var(--danger-dark)' }}>{stats.expiredBatchesCount || 0}</div>
          </div>
        </div>

        {/* Near Expiry */}
        <div className="stat-card amber" style={{ borderLeft: '4px solid #d97706', boxShadow: hasNearExpiry ? '0 0 10px rgba(217, 119, 6, 0.1)' : 'none' }}>
          <div className="stat-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3>Near Expiry</h3>
            <div className="stat-number" style={{ color: '#d97706' }}>{stats.nearExpiryBatchesCount || 0}</div>
          </div>
        </div>
      </div>

      {/* 4. Active Warnings Panel */}
      <div 
        style={{
          backgroundColor: isHealthy ? 'var(--success-light)' : '#fffbeb',
          border: `1px solid ${isHealthy ? 'var(--success)' : '#fde68a'}`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <h4 style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: isHealthy ? 'var(--success-dark)' : 'var(--warning-dark)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
          <ShieldAlert size={18} /> Active Pharmacy Alerts:
        </h4>
        
        {isHealthy ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--success-dark)' }}>
            ✓ All active medicines and batches are currently in good condition. There are no expired items, low stock warnings, or near-expiry batches.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {hasExpired && (
              <li style={{ color: 'var(--danger-dark)', fontWeight: 500 }}>
                ⚠️ <strong>Expired Stock Alert</strong>: There are <strong>{stats.expiredBatchesCount}</strong> expired batch(es) with stock on hand. These are automatically excluded from dispensing. Please remove them from shelves immediately.
              </li>
            )}
            {hasLowStock && (
              <li style={{ color: 'var(--warning-dark)' }}>
                ⚠️ <strong>Low Stock Alert</strong>: You have <strong>{stats.lowStockCount}</strong> medicine(s) running below their set low stock threshold.
              </li>
            )}
            {hasNearExpiry && (
              <li style={{ color: '#d97706' }}>
                📅 <strong>Expiry Warning</strong>: <strong>{stats.nearExpiryBatchesCount}</strong> batch(es) will expire within the next 90 days. Recommend dispensing these first.
              </li>
            )}
          </ul>
        )}
      </div>

    </div>
  );
}
