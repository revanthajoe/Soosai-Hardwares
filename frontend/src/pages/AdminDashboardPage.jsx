import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/common/Alert';
import Loader from '../components/common/Loader';

function AdminDashboardPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [productRes, categoryRes] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(productRes.data || []);
      setCategories(categoryRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreateCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await api.createCategory({ name: newCategory.trim() });
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
      await api.deleteProduct(id);
      setProducts((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Product delete failed.');
    }
  };

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h1>Admin Dashboard</h1>
          <Link to="/admin/products/new" className="button-link">
            Add Product
          </Link>
        </div>
        <p>Manage products, stock, and categories from mobile or laptop.</p>
      </section>

      <section className="grid two">
        <form className="panel" onSubmit={onCreateCategory}>
          <h2>Add Category</h2>
          <input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Paint, Cement, Pipes"
            required
          />
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
        <h2>Products</h2>
        {loading ? <Loader text="Loading products..." /> : null}
        {error ? <Alert type="error">{error}</Alert> : null}
        {!loading && !error ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category?.name || '-'}</td>
                    <td>{product.price}</td>
                    <td>{product.stock}</td>
                    <td className="action-row">
                      <Link className="small-btn" to={`/admin/products/${product.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="small-btn danger"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default AdminDashboardPage;
