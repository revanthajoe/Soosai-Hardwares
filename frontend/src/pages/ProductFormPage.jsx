import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/common/Alert';

const emptyForm = {
  name: '',
  category: '',
  brand: '',
  unit: 'piece',
  price: '',
  stock: '0',
  description: '',
  isFeatured: false,
};

function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const categoryRes = await api.getCategories();
        setCategories(categoryRes.data || []);

        if (isEdit) {
          const productRes = await api.getProductById(id);
          const item = productRes.data;
          setForm({
            name: item.name || '',
            category: item.category?.id || '',
            brand: item.brand || '',
            unit: item.unit || 'piece',
            price: item.price ?? '',
            stock: item.stock ?? 0,
            description: item.description || '',
            isFeatured: Boolean(item.isFeatured),
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load form data.');
      }
    };

    void load();
  }, [id, isEdit]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (file) {
      formData.append('image', file);
    }

    try {
      if (isEdit) {
        await api.updateProduct(id, formData);
      } else {
        await api.createProduct(formData);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Product save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <Link className="button-link ghost-link" to="/admin/dashboard">
            Back to Dashboard
          </Link>
        </div>

        <form className="mobile-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Product Name</label>
          <input id="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />

          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="inline-inputs">
            <div>
              <label htmlFor="brand">Brand</label>
              <input id="brand" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} />
            </div>
            <div>
              <label htmlFor="unit">Unit</label>
              <input id="unit" value={form.unit} onChange={(e) => updateField('unit', e.target.value)} />
            </div>
          </div>

          <div className="inline-inputs">
            <div>
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="stock">Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                required
              />
            </div>
          </div>

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows="3"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />

          <label htmlFor="image">Capture / Upload Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <label className="check-row" htmlFor="featured">
            <input
              id="featured"
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => updateField('isFeatured', e.target.checked)}
            />
            Featured Product
          </label>

          <button className="big-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </form>

        {error ? <Alert type="error">{error}</Alert> : null}
      </section>
    </div>
  );
}

export default ProductFormPage;
