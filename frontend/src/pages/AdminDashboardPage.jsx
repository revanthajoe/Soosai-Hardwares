import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';
import { getStorageData, setStorageData } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AdminDashboardPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState({ visits: 0, whatsapp_orders: 0 });

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [productRes, categoryRes, analyticsRes] = await Promise.all([
        api.getProducts(), 
        api.getCategories(),
        api.getAnalytics()
      ]);
      setProducts(productRes.data || []);
      setCategories(categoryRes.data || []);
      setAnalytics(analyticsRes.data || { visits: 0, whatsapp_orders: 0 });
      
      // Load mock local data
      setOrders(getStorageData('orders', [
        { id: 'ORD-001', customer: 'John Doe', amount: 150.00, status: 'Pending', date: new Date().toISOString() },
        { id: 'ORD-002', customer: 'Jane Smith', amount: 89.99, status: 'Shipped', date: new Date().toISOString() }
      ]));
      setActivityLogs(getStorageData('activityLogs', [
        { id: 1, action: 'System Setup', user: 'Admin', time: new Date().toISOString() }
      ]));
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addLog = (action) => {
    const newLogs = [{ id: Date.now(), action, user: 'Admin', time: new Date().toISOString() }, ...activityLogs].slice(0, 50);
    setActivityLogs(newLogs);
    setStorageData('activityLogs', newLogs);
  };

  const onCreateCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await api.createCategory({ name: newCategory.trim() });
      addLog(`Created category: ${newCategory.trim()}`);
      setNewCategory('');
      await load();
    } catch (err) {
      setError(err.message || 'Category create failed.');
    }
  };

  const onDeleteProduct = async (id) => {
    const ok = window.confirm('Delete this product?');
    if (!ok) return;

    try {
      const p = products.find(prod => prod.id === id);
      await api.deleteProduct(id);
      addLog(`Deleted product: ${p?.name}`);
      setProducts((current) => current.filter((item) => item.id !== id));
      setSelectedProducts(prev => prev.filter(pId => pId !== id));
    } catch (err) {
      setError(err.message || 'Product delete failed.');
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };
  
  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
    const ok = window.confirm(`Delete ${selectedProducts.length} selected products?`);
    if (!ok) return;
    
    try {
      for (const id of selectedProducts) {
        await api.deleteProduct(id);
      }
      addLog(`Bulk deleted ${selectedProducts.length} products`);
      setSelectedProducts([]);
      await load();
    } catch (err) {
      setError(err.message || 'Bulk delete failed.');
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Name,Price\n';
    const csv = products.map(p => `${p.id},"${p.name}",${p.price}`).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_export.csv';
    a.click();
    addLog('Exported products to CSV');
  };

  // Mock analytics
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0).toFixed(2);

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleExportCSV}>Export CSV</button>
            <Link to="/admin/products/new" className="button-link">Add Product</Link>
          </div>
        </div>
        <div className="tabs" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>Catalog</button>
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>Orders</button>
          <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'active' : ''}>Analytics</button>
          <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'active' : ''}>Activity Logs</button>
        </div>
      </section>

      {activeTab === 'products' && (
        <>
          <section className="grid two">
            <form className="panel" onSubmit={onCreateCategory}>
              <h2>Add Category</h2>
              <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Paint, Cement, Pipes" required />
              <button type="submit">Save Category</button>
            </form>
            <section className="panel">
              <h2>Categories</h2>
              <div className="chip-wrap">
                {categories.map((category) => (
                  <span className="chip" key={category.id}>{category.name}</span>
                ))}
              </div>
            </section>
          </section>

          <section className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Products</h2>
              {selectedProducts.length > 0 && (
                <button className="small-btn danger" onClick={handleBulkDelete}>Delete Selected ({selectedProducts.length})</button>
              )}
            </div>
            {loading ? <Loader text="Loading products..." /> : null}
            {error ? <Alert type="error">{error}</Alert> : null}
            {!loading && !error ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" onChange={(e) => setSelectedProducts(e.target.checked ? products.map(p => p.id) : [])} checked={selectedProducts.length === products.length && products.length > 0} />
                      </th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleSelectProduct(product.id)} />
                        </td>
                        <td>{product.name}</td>
                        <td>{product.category?.name || '-'}</td>
                        <td>{product.price}</td>
                        <td className="action-row">
                          <Link className="small-btn" to={`/admin/products/${product.id}/edit`}>Edit</Link>
                          <button type="button" className="small-btn danger" onClick={() => onDeleteProduct(product.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      )}

      {activeTab === 'orders' && (
        <section className="panel">
          <h2>Recent Orders</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td><td>{o.customer}</td><td>${Number(o.amount).toFixed(2)}</td><td>{o.status}</td><td>{new Date(o.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        <>
          <section className="panel grid two" style={{ marginBottom: '2rem' }}>
            <div className="panel" style={{ border: '1px solid var(--border)' }}>
              <h3>Website Visitors</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.visits || 0}</p>
            </div>
            <div className="panel" style={{ border: '1px solid var(--border)' }}>
              <h3>WhatsApp Purchases</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.whatsapp_orders || 0}</p>
            </div>
            <div className="panel" style={{ border: '1px solid var(--border)' }}>
              <h3>Total Revenue</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalRevenue}</p>
            </div>
          </section>

          <section className="panel">
            <h2>Traffic vs Orders Overview</h2>
            <div style={{ width: '100%', height: 350, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Analytics', Visitors: analytics.visits || 0, Orders: analytics.whatsapp_orders || 0 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" stroke="var(--text)" />
                  <YAxis stroke="var(--text)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} 
                  />
                  <Legend />
                  <Bar dataKey="Visitors" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Orders" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {activeTab === 'logs' && (
        <section className="panel">
          <h2>Activity Logs</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {activityLogs.map(log => (
              <li key={log.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <strong>{log.user}</strong>: {log.action} <span style={{ color: '#888', fontSize: '0.85em' }}>({new Date(log.time).toLocaleString()})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default AdminDashboardPage;
