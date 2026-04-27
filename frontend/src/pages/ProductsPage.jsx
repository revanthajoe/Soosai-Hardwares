import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import ProductList from '../components/catalog/ProductList';
import SearchBar from '../components/catalog/SearchBar';
import CategoryFilter from '../components/catalog/CategoryFilter';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryRes, productRes] = await Promise.all([api.getCategories(), api.getProducts()]);
        setCategories(categoryRes.data || []);
        setProducts(productRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map((item) => item.brand).filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category ? String(product.category?.id) === String(category) : true;
      const matchesBrand = brand ? product.brand?.toLowerCase() === brand.toLowerCase() : true;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, search, category, brand]);

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h2>Products</h2>
          <div className="toolbar-controls">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter categories={categories} value={category} onChange={setCategory} />
            <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">All brands</option>
              {brands.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <Loader text="Loading products..." /> : null}
        {error ? <Alert type="error">{error}</Alert> : null}
        {!loading && !error ? <ProductList products={filtered} /> : null}
      </section>
    </div>
  );
}

export default ProductsPage;
