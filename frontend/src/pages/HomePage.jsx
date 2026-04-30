import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProductList from '../components/catalog/ProductList';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import ReviewsSection from '../components/ReviewsSection';

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

      <section className="panel" style={{ padding: 0 }}>
        <div className="toolbar" style={{ padding: '1rem 1rem 0' }}>
          <h2>Visit Our Store</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            15, Bypass Rd, opposite KR Fuels, Gomathy Nagar, Manimoortheeswaram, Tirunelveli, Tamil Nadu 627001
          </p>
          <iframe
            src="https://maps.google.com/maps?q=Soosai+Hardwares,+15,+Bypass+Rd,+Tirunelveli,+Tamil+Nadu&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: '8px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Store Location"
          ></iframe>
        </div>
      </section>

      <ReviewsSection targetId="shop" title="What our customers say about Soosai Hardwares" />
    </div>
  );
}

export default HomePage;
