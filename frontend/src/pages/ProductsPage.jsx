import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductList from '../components/catalog/ProductList';
import ProductFilters from '../components/catalog/ProductFilters';
import Pagination from '../components/catalog/Pagination';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import WhatsAppOrderModal from '../components/WhatsAppOrderModal';
import { useShoppingLists } from '../hooks/useShoppingLists';

const PER_PAGE = 9;

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const {
    wishlistItems,
    wishlistIds,
    compareItems,
    compareIds,
    cartItems,
    toggleWishlist,
    toggleCompare,
    clearCompare,
    addToCart,
    removeFromCart,
  } = useShoppingLists();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [brands, setBrands] = useState([]);

  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sortBy = searchParams.get('sortBy') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key]) params.set(key, newFilters[key]);
      else params.delete(key);
    });
    // Reset page on filter change
    if ('q' in newFilters || 'category' in newFilters || 'brand' in newFilters || 'sortBy' in newFilters) {
      if (!('page' in newFilters)) params.set('page', '1');
    }
    setSearchParams(params);
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.getCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    const loadBrands = async () => {
      try {
        const res = await api.getBrands();
        setBrands(res.data || []);
      } catch (err) {
        console.error('Failed to load brands', err);
      }
    };
    loadCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadProducts = async () => {
      setLoading(true);
      // Clear any previous failure, otherwise the grid stays hidden forever
      // once a single request has failed.
      setError('');
      try {
        const query = new URLSearchParams();
        if (search) query.set('q', search);
        if (category) query.set('category', category);
        if (brand) query.set('brand', brand);
        if (sortBy) query.set('sortBy', sortBy);
        query.set('page', page);
        query.set('limit', PER_PAGE);

        const res = await api.getProducts(`?${query.toString()}`);
        if (!ignore) {
          setProducts(res.data || []);
          if (res.pagination) {
            setTotalPages(res.pagination.pages || 1);
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load products.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProducts();
    return () => { ignore = true; };
  }, [search, category, brand, sortBy, page]);

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h1>Products</h1>
          <ProductFilters 
            search={search} setSearch={(q) => updateFilters({ q })}
            category={category} setCategory={(c) => updateFilters({ category: c })} categories={categories}
            brand={brand} setBrand={(b) => updateFilters({ brand: b })} brands={brands}
            sortBy={sortBy} setSortBy={(s) => updateFilters({ sortBy: s })}
            onReset={() => updateFilters({ q: '', category: '', brand: '', sortBy: 'featured', page: '1' })}
          />
        </div>

        <div className="grid two">
          <section className="panel compact">
            <h3>Wishlist</h3>
            {wishlistItems.length ? (
              <ul className="mini-list">
                {wishlistItems.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => toggleWishlist(item)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No wishlist items yet.</p>
            )}
          </section>

          <section className="panel compact">
            <h3>Cart</h3>
            {cartItems.length ? (
              <ul className="mini-list">
                {cartItems.map((item) => (
                  <li key={item.id}>
                    <span>{item.product?.name} × {item.qty}</span>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Cart is empty.</p>
            )}
            {cartItems.length > 0 && (
              <button 
                className="wa-btn" 
                style={{ width: '100%', marginTop: '1rem', display: 'block', textAlign: 'center' }}
                onClick={() => {
                  setModalItems(cartItems);
                  setOrderModalOpen(true);
                }}
              >
                Checkout on WhatsApp
              </button>
            )}
          </section>
        </div>

        {loading ? <Loader text="Loading products..." /> : null}
        {error ? <Alert type="error">{error}</Alert> : null}
        {!loading && !error ? (
          <>
            <ProductList
              products={products}
              wishlistIds={wishlistIds}
              compareIds={compareIds}
              canCompare={compareIds.length < 3}
              onToggleWishlist={toggleWishlist}
              onToggleCompare={toggleCompare}
              onAddToCart={addToCart}
              onOrderWhatsApp={(product) => {
                setModalItems([{ id: product.id, qty: 1, product }]);
                setOrderModalOpen(true);
              }}
            />
            <Pagination page={page} totalPages={totalPages} onChange={(p) => updateFilters({ page: String(p) })} />
          </>
        ) : null}

        {compareItems.length ? (
          <section className="panel compare-panel">
            <div className="toolbar">
              <h3>Compare Products</h3>
              <button type="button" className="ghost" onClick={clearCompare}>
                Clear
              </button>
            </div>
            <div className="compare-grid">
              {compareItems.map((item) => (
                <div key={item.id} className="compare-card">
                  <h4>{item.name}</h4>
                  <p>{item.brand || 'Generic'}</p>

                </div>
              ))}
            </div>
          </section>
        ) : null}

        <WhatsAppOrderModal 
          isOpen={orderModalOpen} 
          onClose={() => setOrderModalOpen(false)} 
          items={modalItems} 
        />
      </section>
    </div>
  );
}

export default ProductsPage;
