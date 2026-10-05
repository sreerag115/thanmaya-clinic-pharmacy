import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, ShoppingBag, PlusCircle, HeartPulse } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InventoryTable from './components/InventoryTable';
import DispenseForm from './components/DispenseForm';
import AddStockForm from './components/AddStockForm';
import EditMedicineModal from './components/EditMedicineModal';
import EditBatchModal from './components/EditBatchModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Success message and dispense result states
  const [successMessage, setSuccessMessage] = useState('');
  const [dispenseResult, setDispenseResult] = useState(null);

  // Modal states
  const [editingMed, setEditingMed] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);

  // Fetch all medicines and dashboard stats
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await fetch('/api/dashboard');
      if (!statsRes.ok) throw new Error('Failed to fetch dashboard statistics.');
      const statsData = await statsRes.json();
      setStats(statsData);

      const medsRes = await fetch('/api/medicines');
      if (!medsRes.ok) throw new Error('Failed to fetch medicines inventory.');
      const medsData = await medsRes.json();
      setMedicines(medsData);
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleDispense = async (name, quantity) => {
    try {
      const res = await fetch('/api/medicines/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dispense failed');
      }

      setDispenseResult(data);
      fetchData(); // Refresh data
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleBulkDispense = async (items) => {
    try {
      const res = await fetch('/api/medicines/dispense/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk dispense failed');
      }

      setDispenseResult(data);
      fetchData(); // Refresh data
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleAddStock = async (payload) => {
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add stock');
      }

      setSuccessMessage(data.message);
      fetchData(); // Refresh data
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleSaveMedicine = async (id, payload) => {
    try {
      const res = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update medicine');

      fetchData();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleDeleteMedicine = async (id) => {
    try {
      const res = await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete medicine');

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveBatch = async (id, payload) => {
    try {
      const res = await fetch(`/api/batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update batch');

      fetchData();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleDeleteBatch = async (id) => {
    try {
      const res = await fetch(`/api/batches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete batch');

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">T</div>
          <div className="header-title-wrapper">
            <h1>Thanmaya Clinic</h1>
            <p>Pharmacy Inventory Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="app-nav">
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Database size={16} /> Search & Inventory
          </button>
          <button
            className={`nav-tab ${activeTab === 'dispense' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dispense');
              setDispenseResult(null); // Clear previous result on open
            }}
          >
            <ShoppingBag size={16} /> Dispense Medicine
          </button>
          <button
            className={`nav-tab ${activeTab === 'addStock' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('addStock');
              setSuccessMessage(''); // Clear previous message
            }}
          >
            <PlusCircle size={16} /> Add Stock
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--success-dark)', backgroundColor: 'var(--success-light)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
          <HeartPulse size={16} /> Server Offline & Secure
        </div>
      </header>

      {/* Main Workspace */}
      <main className="app-main">
        {loading && medicines.length === 0 ? (
          <div className="empty-state">
            <p>Loading Thanmaya inventory database...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <p>Error connecting to backend database: {error}</p>
            <button className="btn btn-secondary btn-sm" onClick={fetchData} style={{ marginTop: '0.5rem' }}>
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Render Dashboard Statistics first if we are on dashboard tab */}
            {activeTab === 'dashboard' && (
              <>
                <Dashboard stats={stats} />
                
                <div className="content-layout two-cols">
                  {/* Quick Dispense Form */}
                  <DispenseForm
                    medicines={medicines}
                    onDispense={handleDispense}
                    onBulkDispense={handleBulkDispense}
                    dispenseResult={dispenseResult}
                    clearDispenseResult={() => setDispenseResult(null)}
                  />

                  {/* Add stock quickly */}
                  <AddStockForm
                    medicines={medicines}
                    onAddStock={handleAddStock}
                    successMessage={successMessage}
                    clearSuccessMessage={() => setSuccessMessage('')}
                  />
                </div>
              </>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <InventoryTable
                medicines={medicines}
                onEditMedicine={setEditingMed}
                onDeleteMedicine={handleDeleteMedicine}
                onEditBatch={setEditingBatch}
                onDeleteBatch={handleDeleteBatch}
              />
            )}

            {/* Dedicated Dispense Tab */}
            {activeTab === 'dispense' && (
               <DispenseForm
                 medicines={medicines}
                 onDispense={handleDispense}
                 onBulkDispense={handleBulkDispense}
                 dispenseResult={dispenseResult}
                 clearDispenseResult={() => setDispenseResult(null)}
               />
            )}

            {/* Dedicated Add Stock Tab */}
            {activeTab === 'addStock' && (
              <AddStockForm
                medicines={medicines}
                onAddStock={handleAddStock}
                successMessage={successMessage}
                clearSuccessMessage={() => setSuccessMessage('')}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <EditMedicineModal
        isOpen={editingMed !== null}
        medicine={editingMed}
        onClose={() => setEditingMed(null)}
        onSave={handleSaveMedicine}
      />

      <EditBatchModal
        isOpen={editingBatch !== null}
        batch={editingBatch}
        onClose={() => setEditingBatch(null)}
        onSave={handleSaveBatch}
      />
    </div>
  );
}
