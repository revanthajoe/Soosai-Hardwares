import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';
import { getStorageData, setStorageData } from '../utils/storage';
import { toMediaUrl } from '../services/media';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Largest page size the products API will honour (see productController).
const ADMIN_PAGE_SIZE = 200;

// The admin list must show every product, including inactive ones, no matter
// how large the catalogue grows. The API caps `limit` at 200, so page through
// until the reported page count is exhausted rather than relying on a single
// oversized request (which silently truncated the list at 200 before).
const fetchAllProducts = async () => {
  const first = await api.getProducts(`?activeOnly=false&limit=${ADMIN_PAGE_SIZE}&page=1`);
  const totalPages = first.pagination?.pages || 1;

  if (totalPages <= 1) return first.data || [];

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      api.getProducts(`?activeOnly=false&limit=${ADMIN_PAGE_SIZE}&page=${i + 2}`)
    )
  );

  return rest.reduce((all, res) => all.concat(res.data || []), first.data || []);
};

function AdminDashboardPage() {
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsError, setAnalyticsError] = useState('');
  const [adsError, setAdsError] = useState('');

  const [activeTab, setActiveTab] = useState('products');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState({ visits: 0, whatsapp_orders: 0 });
  const [ads, setAds] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setAnalyticsError('');
    setAdsError('');

    const [productResult, categoryResult, analyticsResult, adsResult] = await Promise.allSettled([
      fetchAllProducts(),
      api.getCategories(),
      api.getAnalytics(),
      api.getAdminAds(),
    ]);

    if (productResult.status === 'fulfilled' && categoryResult.status === 'fulfilled') {
      setProducts(productResult.value || []);
      setCategories(categoryResult.value.data || []);
    } else {
      const failed = productResult.status === 'rejected' ? productResult.reason : categoryResult.reason;
      setError(failed?.message || 'Failed to load admin data.');
    }

    if (analyticsResult.status === 'fulfilled') {
      setAnalytics(analyticsResult.value.data || { visits: 0, whatsapp_orders: 0 });
    } else {
      setAnalyticsError(analyticsResult.reason?.message || 'Failed to load analytics.');
    }

    if (adsResult.status === 'fulfilled') {
      setAds(adsResult.value.data || []);
    } else {
      setAdsError(adsResult.reason?.message || 'Failed to load advertisements.');
    }

    // Load mock local data
    setOrders(getStorageData('orders', [
      { id: 'ORD-001', customer: 'John Doe', completed: false, date: new Date().toISOString() },
      { id: 'ORD-002', customer: 'Jane Smith', completed: true, date: new Date().toISOString() }
    ]));
    setActivityLogs(getStorageData('activityLogs', [
      { id: 1, action: 'System Setup', user: 'Admin', time: new Date().toISOString() }
    ]));

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addLog = (action) => {
    setActivityLogs((current) => {
      const now = new Date();
      const newLogs = [
        { id: `${now.getTime()}-${action}`, action, user: 'Admin', time: now.toISOString() },
        ...current,
      ].slice(0, 50);
      setStorageData('activityLogs', newLogs);
      return newLogs;
    });
  };

  const toggleOrderStatus = (orderId) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, completed: !o.completed } : o);
    setOrders(updatedOrders);
    setStorageData('orders', updatedOrders);
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

  // The full list is already in memory, so filtering client-side keeps this
  // instant and needs no extra endpoint.
  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.brand, product.nickname, product.category?.name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [products, productSearch]);

  const onToggleProductActive = async (product) => {
    try {
      const formData = new FormData();
      formData.append('isActive', String(!product.isActive));
      await api.updateProduct(product.id, formData);
      addLog(`${product.isActive ? 'Hid' : 'Published'} product: ${product.name}`);
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, isActive: !product.isActive } : item))
      );
    } catch (err) {
      setError(err.message || 'Product update failed.');
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };
  
  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
    const ok = window.confirm(`Delete ${selectedProducts.length} selected products?`);
    if (!ok) return;
    
    const results = await Promise.allSettled(selectedProducts.map((id) => api.deleteProduct(id)));
    const failed = results.filter((result) => result.status === 'rejected');

    addLog(`Bulk deleted ${results.length - failed.length} products`);
    setSelectedProducts([]);

    if (failed.length) {
      setError(`${failed.length} of ${results.length} deletions failed: ${failed[0].reason?.message || 'unknown error'}`);
    }

    await load();
  };

  const onToggleAdActive = async (ad) => {
    try {
      const formData = new FormData();
      formData.append('isActive', !ad.isActive);
      await api.updateAd(ad.id, formData);
      addLog(`${ad.isActive ? 'Deactivated' : 'Activated'} advertisement: ${ad.title || ad.id}`);
      setAds((current) => current.map((item) => (item.id === ad.id ? { ...item, isActive: !ad.isActive } : item)));
    } catch (err) {
      setAdsError(err.message || 'Advertisement update failed.');
    }
  };

  const onReorderAd = async (id, direction) => {
    try {
      const res = await api.reorderAd(id, direction);
      setAds(res.data || []);
    } catch (err) {
      setAdsError(err.message || 'Advertisement reorder failed.');
    }
  };

  const onDeleteAd = async (id) => {
    const ok = window.confirm('Delete this advertisement?');
    if (!ok) return;

    try {
      await api.deleteAd(id);
      addLog('Deleted advertisement');
      setAds((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setAdsError(err.message || 'Advertisement delete failed.');
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Name,Brand,Category\n';
    const csv = products.map(p => `${p.id},"${p.name}","${p.brand || ''}","${p.category?.name || ''}"`).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    addLog('Exported products to CSV');
  };

  // Mock analytics

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleExportCSV}>Export CSV</button>
            <Link to="/admin/products/new" className="button-link">Add Product</Link>
            <Link to="/admin/ads/new" className="button-link">Add Ad</Link>
          </div>
        </div>
        <div className="tabs" style={{ marginTop: '1rem' }}>
          <button onClick={() => setActiveTab('products')} className={activeTab === 'products' ? 'active' : ''}>Catalog</button>
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>Orders</button>
          <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'active' : ''}>Analytics</button>
          <button onClick={() => setActiveTab('ads')} className={activeTab === 'ads' ? 'active' : ''}>Ads</button>
          <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'active' : ''}>Activity</button>
        </div>
      </section>

      {activeTab === 'products' && (
        <>
          <section className="grid two">
            <form className="panel" onSubmit={onCreateCategory}>
              <h2>Add Category</h2>
              <label htmlFor="newCategory">Category Name</label>
              <input id="newCategory" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Paint, Cement, Pipes" required />
              <button type="submit">Save Category</button>
            </form>
            <section className="panel">
              <h2>Categories</h2>
              {loading ? <Loader text="Loading categories..." /> : null}
              {error ? <Alert type="error">{error}</Alert> : null}
              {!loading && !error ? (
                <div className="chip-wrap">
                  {categories.map((category) => (
                    <span className="chip" key={category.id}>{category.name}</span>
                  ))}
                </div>
              ) : null}
            </section>
          </section>

          <section className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Products</h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label htmlFor="productSearch" className="sr-only">Search products</label>
                <input
                  id="productSearch"
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search name, brand, category..."
                  style={{ minWidth: '260px' }}
                />
                {selectedProducts.length > 0 && (
                  <button className="small-btn danger" onClick={handleBulkDelete}>Delete Selected ({selectedProducts.length})</button>
                )}
              </div>
            </div>
            {!loading && !error ? (
              <p className="muted" style={{ marginTop: 0, marginBottom: '1rem' }}>
                Showing {visibleProducts.length} of {products.length} products
              </p>
            ) : null}
            {loading ? <Loader text="Loading products..." /> : null}
            {error ? <Alert type="error">{error}</Alert> : null}
            {!loading && !error ? (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Select all products"
                          onChange={(e) => setSelectedProducts(e.target.checked ? visibleProducts.map(p => p.id) : [])}
                          checked={visibleProducts.length > 0 && visibleProducts.every(p => selectedProducts.includes(p.id))}
                        />
                      </th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <input type="checkbox" aria-label={`Select ${product.name}`} checked={selectedProducts.includes(product.id)} onChange={() => handleSelectProduct(product.id)} />
                        </td>
                        <td>{product.name}</td>
                        <td>{product.category?.name || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className={`status-badge ${product.isActive ? 'is-active' : 'is-hidden'}`}
                            onClick={() => onToggleProductActive(product)}
                            title={product.isActive ? 'Visible on the storefront - click to hide' : 'Hidden from the storefront - click to publish'}
                          >
                            {product.isActive ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="action-row">
                          <Link className="small-btn" to={`/admin/products/${product.id}/edit`}>Edit</Link>
                          <button type="button" className="small-btn danger" onClick={() => onDeleteProduct(product.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {visibleProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                          {products.length === 0
                            ? 'No products yet.'
                            : `No products match "${productSearch}".`}
                        </td>
                      </tr>
                    ) : null}
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
              <thead><tr><th>Completed</th><th>ID</th><th>Customer</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ opacity: o.completed ? 0.6 : 1 }}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={o.completed} 
                        onChange={() => toggleOrderStatus(o.id)} 
                        style={{ transform: 'scale(1.3)', cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                    </td>
                    <td>{o.id}</td><td>{o.customer}</td><td>{new Date(o.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'analytics' && (
        <>
          {analyticsError ? <Alert type="error">{analyticsError}</Alert> : null}
          <section className="panel grid two" style={{ marginBottom: '2rem' }}>
            <div className="panel" style={{ border: '1px solid var(--border)' }}>
              <h3>Website Visitors</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.visits || 0}</p>
            </div>
            <div className="panel" style={{ border: '1px solid var(--border)' }}>
              <h3>WhatsApp Purchases</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.whatsapp_orders || 0}</p>
            </div>
            <div className="panel" style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
              <h3>Conversion Rate</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {analytics.visits ? ((analytics.whatsapp_orders / analytics.visits) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </section>

          <section className="panel">
            <h2>Store Engagement Funnel</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>Visualizing the drop-off from total store visitors to completed WhatsApp purchases.</p>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { stage: 'Total Store Visitors', count: analytics.visits || 0, fill: '#8884d8' },
                    { stage: 'WhatsApp Orders', count: analytics.whatsapp_orders || 0, fill: '#82ca9d' }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="stage" stroke="var(--text)" />
                  <YAxis stroke="var(--text)" allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {activeTab === 'ads' && (
        <section className="panel">
          <h2>Advertisements</h2>
          {adsError ? <Alert type="error">{adsError}</Alert> : null}
          {!adsError ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Active</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad, index) => (
                    <tr key={ad.id}>
                      <td>
                        {ad.mediaType === 'video' ? (
                          <video src={toMediaUrl(ad.mediaUrl)} muted style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <img src={toMediaUrl(ad.mediaUrl)} alt={ad.title || 'Ad'} style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                        )}
                      </td>
                      <td>{ad.title || '-'}</td>
                      <td>{ad.mediaType}</td>
                      <td>
                        <input type="checkbox" checked={ad.isActive} onChange={() => onToggleAdActive(ad)} />
                      </td>
                      <td className="action-row">
                        <button type="button" className="small-btn" disabled={index === 0} onClick={() => onReorderAd(ad.id, 'up')}>↑</button>
                        <button type="button" className="small-btn" disabled={index === ads.length - 1} onClick={() => onReorderAd(ad.id, 'down')}>↓</button>
                      </td>
                      <td className="action-row">
                        <Link className="small-btn" to={`/admin/ads/${ad.id}/edit`}>Edit</Link>
                        <button type="button" className="small-btn danger" onClick={() => onDeleteAd(ad.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}

      {activeTab === 'logs' && (
        <section className="panel">
          <h2>Activity Logs</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {activityLogs.map(log => (
              <li key={log.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
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
