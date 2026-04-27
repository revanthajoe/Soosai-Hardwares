import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProductList from '../components/catalog/ProductList';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getProducts('?featured=true');
        setFeaturedProducts((response.data || []).slice(0, 6));
      } catch (err) {
        setError(err.message || 'Failed to load featured products.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="container page-gap">
      <section className="hero-banner">
        <p className="kicker">Hardware made easy</p>
        <h1>Everything your site needs, ready for WhatsApp ordering</h1>
        <p>
          Browse by category, check stock instantly, and place orders directly over WhatsApp.
        </p>
        <div className="hero-actions">
          <Link to="/products" className="button-link">
            Browse Products
          </Link>
          <Link to="/admin/login" className="button-link ghost-link">
            Admin Access
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>Featured Products</h2>
        </div>

        {loading ? <Loader text="Loading featured products..." /> : null}
        {error ? <Alert type="error">{error}</Alert> : null}
        {!loading && !error ? <ProductList products={featuredProducts} /> : null}
      </section>
    </div>
  );
}

export default HomePage;
