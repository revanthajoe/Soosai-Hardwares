import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import ProductList from '../components/catalog/ProductList';
import ProductFilters from '../components/catalog/ProductFilters';
import Pagination from '../components/catalog/Pagination';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import WhatsAppOrderModal from '../components/WhatsAppOrderModal';
import { loadJSON, saveJSON, subscribeStorage } from '../utils/storage';

const WISHLIST_KEY = 'soosai:wishlist';
const COMPARE_KEY = 'soosai:compare';
const CART_KEY = 'soosai:cart';
const PER_PAGE = 9;

function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState([]);

  const refreshLocalState = () => {
    setWishlistIds(loadJSON(WISHLIST_KEY, []));
    setCompareIds(loadJSON(COMPARE_KEY, []));
    setCartItems(loadJSON(CART_KEY, []));
  };

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

  useEffect(() => {
    refreshLocalState();
    return subscribeStorage((key) => {
      if ([WISHLIST_KEY, COMPARE_KEY, CART_KEY].includes(key)) {
        refreshLocalState();
      }
    });
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map((item) => item.brand).filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                            (product.nickname && product.nickname.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category ? String(product.category?.id) === String(category) : true;
      const matchesBrand = brand ? product.brand?.toLowerCase() === brand.toLowerCase() : true;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, search, category, brand]);

  const sorted = useMemo(() => {
    const items = [...filtered];

    const parsePrice = (priceStr) => parseFloat(String(priceStr).replace(/[^\d.]/g, '')) || 0;

    switch (sortBy) {
      case 'name-asc':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return items.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return items.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case 'price-desc':
        return items.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case 'newest':
        return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      default:
        return items.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return sorted.slice(start, start + PER_PAGE);
  }, [page, sorted]);

  useEffect(() => {
    setPage(1);
  }, [search, category, brand, sortBy]);

  const handleToggleWishlist = (product) => {
    const next = wishlistIds.includes(product.id)
      ? wishlistIds.filter((id) => id !== product.id)
      : [...wishlistIds, product.id];
    saveJSON(WISHLIST_KEY, next);
  };

  const handleToggleCompare = (product) => {
    if (compareIds.includes(product.id)) {
      saveJSON(COMPARE_KEY, compareIds.filter((id) => id !== product.id));
      return;
    }

    if (compareIds.length >= 3) return;
    saveJSON(COMPARE_KEY, [...compareIds, product.id]);
  };

  const handleAddToCart = (product, qty) => {
    const current = [...cartItems];
    const index = current.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      current[index] = {
        ...current[index],
        qty: current[index].qty + qty,
      };
    } else {
      current.push({ id: product.id, qty, product });
    }
    saveJSON(CART_KEY, current);
  };

  const handleRemoveFromCart = (id) => {
    saveJSON(CART_KEY, cartItems.filter((item) => item.id !== id));
  };

  const compareItems = compareIds
    .map((id) => products.find((item) => item.id === id))
    .filter(Boolean);

  const wishlistItems = wishlistIds
    .map((id) => products.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <div className="container page-gap">
      <section className="panel">
        <div className="toolbar">
          <h2>Products</h2>
          <ProductFilters 
            search={search} setSearch={setSearch}
            category={category} setCategory={setCategory} categories={categories}
            brand={brand} setBrand={setBrand} brands={brands}
            sortBy={sortBy} setSortBy={setSortBy}
            onReset={() => {
              setSearch('');
              setCategory('');
              setBrand('');
              setSortBy('featured');
            }}
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
                      onClick={() => handleToggleWishlist(item)}
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
                      onClick={() => handleRemoveFromCart(item.id)}
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
              products={pageItems}
              wishlistIds={wishlistIds}
              compareIds={compareIds}
              canCompare={compareIds.length < 3}
              onToggleWishlist={handleToggleWishlist}
              onToggleCompare={handleToggleCompare}
              onAddToCart={handleAddToCart}
              onOrderWhatsApp={(product) => {
                setModalItems([{ id: product.id, qty: 1, product }]);
                setOrderModalOpen(true);
              }}
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        ) : null}

        {compareItems.length ? (
          <section className="panel compare-panel">
            <div className="toolbar">
              <h3>Compare Products</h3>
              <button type="button" className="ghost" onClick={() => saveJSON(COMPARE_KEY, [])}>
                Clear
              </button>
            </div>
            <div className="compare-grid">
              {compareItems.map((item) => (
                <div key={item.id} className="compare-card">
                  <h4>{item.name}</h4>
                  <p>{item.brand || 'Generic'}</p>
                  <p>₹{item.price}</p>
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
