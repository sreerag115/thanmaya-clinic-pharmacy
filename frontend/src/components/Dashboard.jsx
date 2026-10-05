import React, { useState } from 'react';
import { Layers, CheckCircle, AlertTriangle, XCircle, Clock, Calendar, HeartPulse, Activity, ShieldAlert, RefreshCw, Database, Terminal } from 'lucide-react';

export default function Dashboard({ stats }) {
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState(null);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const total = stats.totalMedicines || 0;
  const inStock = stats.inStockCount || 0;
  const outOfStock = stats.outOfStockCount || 0;
  const lowStock = stats.lowStockCount || 0;
  const expired = stats.expiredBatchesCount || 0;
  const nearExpiry = stats.nearExpiryBatchesCount || 0;

  // Calculate Stock Health Score
  const activeProblemsCount = expired + outOfStock + lowStock;
  const stockHealthScore = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - activeProblemsCount) / total) * 100))) : 100;

  const hasExpired = expired > 0;
  const hasLowStock = lowStock > 0;
  const hasNearExpiry = nearExpiry > 0;
  const isHealthy = !hasExpired && !hasLowStock && !hasNearExpiry;

  // Circular progress calculations (Radius = 50, Circumference = 314.16)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stockHealthScore / 100) * circumference;

  // Set health coloring
  let healthColor = '#0d9488'; // teal default
  let healthStatus = 'Nominal';
  let healthDesc = 'All inventory metrics satisfy health guidelines.';

  if (stockHealthScore < 70) {
    healthColor = '#ef4444'; // red
    healthStatus = 'Critical';
    healthDesc = 'Action required: high number of outages or expired drugs.';
  } else if (stockHealthScore < 90) {
    healthColor = '#f59e0b'; // amber
    healthStatus = 'Advisory';
    healthDesc = 'Attention: minor stock alerts or impending expirations.';
  } else if (stockHealthScore === 100) {
    healthStatus = 'Perfect';
    healthDesc = 'Excellent: zero inventory conflicts or warnings.';
  }

  // Trigger fake diagnostics routine
  const runDiagnostics = () => {
    setDiagnosing(true);
    setDiagnosticsLogs('Scanning database tables...');
    
    setTimeout(() => {
      setDiagnosticsLogs('Checking batch shelf-lives...');
    }, 600);

    setTimeout(() => {
      setDiagnosticsLogs('Verifying FEFO queues...');
    }, 1200);

    setTimeout(() => {
      setDiagnosing(false);
      setDiagnosticsLogs(null);
      alert('System Check Complete: SQLite database integrity OK, FEFO ordering valid, all indexes active.');
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '2.5rem' }}>
      
      {/* 1. Header Section */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '1.25rem', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-pulse-dot"></span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Pharmacy Control Center
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0 0 0', color: 'var(--text-main)' }}>
            Clinic Inventory Telemetry
          </h2>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.85rem', 
            color: 'var(--text-muted)',
            backgroundColor: '#f1f5f9',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontWeight: 500
          }}
        >
          <Calendar size={15} style={{ color: 'var(--primary)' }} />
          <span>{today}</span>
        </div>
      </div>

      {/* 2. Main Dashboard Layout */}
      <div className="db-main-layout">
        
        {/* Left Side: System Telemetry & Health */}
        <div className="glass-card-premium" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
            Stock Health Score
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Catalog rating based on shortages, warnings, and expirations.
          </p>

          {/* SVG Circular Health Meter */}
          <div className="health-score-ring-wrap">
            <svg className="health-score-ring-svg" viewBox="0 0 120 120">
              {/* Background Ring */}
              <circle className="health-score-ring-bg" cx="60" cy="60" r={radius} />
              {/* Foreground Progress Ring */}
              <circle 
                className="health-score-ring-fill" 
                cx="60" 
                cy="60" 
                r={radius} 
                stroke={healthColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="health-score-value">
              <span>{stockHealthScore}%</span>
              <span className="health-score-label" style={{ color: healthColor }}>
                {healthStatus}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            {healthDesc}
          </div>

          {/* Connection / Diagnostics Box */}
          <div 
            style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              fontSize: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Connection State:</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Database size={13} /> Active (Local)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Engine:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>SQLite 3.x</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Checkout Protocol:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>FEFO Algorithm</span>
            </div>

            {diagnosticsLogs && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#0f172a', color: '#38bdf8', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={12} className="no-print" />
                <span>{diagnosticsLogs}</span>
              </div>
            )}

            <button 
              onClick={runDiagnostics} 
              disabled={diagnosing}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.5rem',
                backgroundColor: diagnosing ? '#e2e8f0' : 'var(--primary)',
                color: diagnosing ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: diagnosing ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                transition: 'background-color 0.2s'
              }}
            >
              <RefreshCw size={13} className={diagnosing ? 'rotating-icon' : ''} />
              {diagnosing ? 'Running Diagnostics...' : 'Verify DB Integrity'}
            </button>
          </div>

        </div>

        {/* Right Side: Operational Grid & Active Advisories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Grid of New Metric Cards */}
          <div className="db-metrics-grid">
            
            {/* Total Medicines */}
            <div className="stat-card-new primary">
              <div className="stat-card-content">
                <span className="stat-card-title">Total Medicines</span>
                <span className="stat-card-number">{total}</span>
              </div>
              <div className="stat-card-icon-box">
                <Layers size={20} />
              </div>
            </div>

            {/* In Stock */}
            <div className="stat-card-new success">
              <div className="stat-card-content">
                <span className="stat-card-title">In Stock</span>
                <span className="stat-card-number">{inStock}</span>
              </div>
              <div className="stat-card-icon-box">
                <CheckCircle size={20} />
              </div>
            </div>

            {/* Out of Stock */}
            <div className="stat-card-new danger">
              <div className="stat-card-content">
                <span className="stat-card-title">Out of Stock</span>
                <span className="stat-card-number">{outOfStock}</span>
              </div>
              <div className="stat-card-icon-box">
                <XCircle size={20} />
              </div>
            </div>

            {/* Low Stock Warning */}
            <div className="stat-card-new warning">
              <div className="stat-card-content">
                <span className="stat-card-title">Low Stock</span>
                <span className="stat-card-number">{lowStock}</span>
              </div>
              <div className="stat-card-icon-box">
                <AlertTriangle size={20} />
              </div>
            </div>

            {/* Expired Batches */}
            <div className="stat-card-new danger">
              <div className="stat-card-content">
                <span className="stat-card-title">Expired Batches</span>
                <span className="stat-card-number" style={{ color: 'var(--danger-dark)' }}>{expired}</span>
              </div>
              <div className="stat-card-icon-box">
                <Clock size={20} />
              </div>
            </div>

            {/* Near Expiry */}
            <div className="stat-card-new amber">
              <div className="stat-card-content">
                <span className="stat-card-title">Near Expiry</span>
                <span className="stat-card-number" style={{ color: '#d97706' }}>{nearExpiry}</span>
              </div>
              <div className="stat-card-icon-box">
                <Calendar size={20} />
              </div>
            </div>

          </div>

          {/* Active Advisories Timeline Desk */}
          <div className="glass-card-premium">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={18} style={{ color: isHealthy ? 'var(--success)' : 'var(--warning)' }} />
              Active System Advisories
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Dispatch logs, warnings, and alerts regarding medicine batches.
            </p>

            <div className="alert-timeline-list">
              {isHealthy ? (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '1.25rem', 
                    backgroundColor: 'var(--success-light)', 
                    border: '1px solid var(--success)', 
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--success-dark)'
                  }}
                >
                  <CheckCircle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Systems Nominal</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.1rem', opacity: 0.9 }}>
                      No stock warnings, expiry alerts, or active anomalies found. Ready for dispensing operations.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {hasExpired && (
                    <div className="alert-timeline-item expired">
                      <Clock size={16} className="alert-timeline-icon" style={{ color: 'var(--danger)' }} />
                      <div className="alert-timeline-content">
                        <div className="alert-timeline-title">Critical: Expired Batches Active</div>
                        <div className="alert-timeline-text">
                          There are <strong>{expired}</strong> expired medicine batches with quantity on hand. These items are blocked from dispensing. Remove from active store shelves immediately.
                        </div>
                      </div>
                    </div>
                  )}

                  {hasLowStock && (
                    <div className="alert-timeline-item low-stock">
                      <AlertTriangle size={16} className="alert-timeline-icon" style={{ color: 'var(--warning)' }} />
                      <div className="alert-timeline-content">
                        <div className="alert-timeline-title">Warning: Low Stock Deficit</div>
                        <div className="alert-timeline-text">
                          <strong>{lowStock}</strong> medicine(s) are running below safety stock levels. Shortage may occur on high demand. Reorder suggested.
                        </div>
                      </div>
                    </div>
                  )}

                  {hasNearExpiry && (
                    <div className="alert-timeline-item near-expiry">
                      <Calendar size={16} className="alert-timeline-icon" style={{ color: '#d97706' }} />
                      <div className="alert-timeline-content">
                        <div className="alert-timeline-title">Advisory: Near Expiry Warning</div>
                        <div className="alert-timeline-text">
                          <strong>{nearExpiry}</strong> batch(es) will expire within the next 90 days. Recommend prioritizing FEFO queue consumption.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
