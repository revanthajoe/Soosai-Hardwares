import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../services/auth';
import { api } from '../../services/api';

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = auth.getUser();
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await api.getBrands();
        setBrands(res.data || []);
      } catch (err) {
        console.error('Failed to load brands', err);
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    };
    loadBrands();
  }, []);

  // Close dropdown on outside click (mobile)
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBrandsOpen(false);
      }
    };
    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const handleLogout = () => {
    auth.clearSession();
    navigate('/admin/login');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="top-nav">
      <div className="container nav-wrap">
        <Link to="/" className="brand" onClick={closeMobile}>
          ⚙️ Soosai Hardwares
        </Link>

        <div className="nav-right">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <nav className="nav-links">
            <NavLink to="/" onClick={closeMobile}>Home</NavLink>
            <NavLink to="/products" onClick={closeMobile}>Products</NavLink>

            <div className="nav-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="nav-dropdown-trigger"
                onClick={() => setBrandsOpen(!brandsOpen)}
              >
                Brands ▾
              </button>
              {brandsOpen && (
                <div className="nav-dropdown-content show">
                  {loadingBrands ? (
                    <div style={{ padding: '0.6rem 1rem', opacity: 0.7 }}>Loading...</div>
                  ) : brands.length > 0 ? (
                    <>
                      {brands.map((b) => (
                        <Link
                          key={b}
                          to={`/products?brand=${encodeURIComponent(b)}`}
                          onClick={() => { setBrandsOpen(false); closeMobile(); }}
                        >
                          {b}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.2rem 0' }}></div>
                      <Link
                        to="/products"
                        className="view-all-brands"
                        onClick={() => { setBrandsOpen(false); closeMobile(); }}
                      >
                        View All Products
                      </Link>
                    </>
                  ) : (
                    <div style={{ padding: '0.6rem 1rem', opacity: 0.7 }}>No brands found</div>
                  )}
                </div>
              )}
            </div>

            {user ? <NavLink to="/admin/dashboard">Admin</NavLink> : null}
          </nav>

          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label="Toggle theme"
              type="button"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <button className="ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link to="/admin/login" className="button-link">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <button className="drawer-close" onClick={closeMobile} aria-label="Close menu">
                ✕
              </button>
              
              <div className="drawer-section-title">Explore Brands</div>
              <div className="drawer-links" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                {loadingBrands ? (
                  <div style={{ opacity: 0.7 }}>Loading...</div>
                ) : brands.length > 0 ? (
                  <>
                    {brands.map((b) => (
                      <Link
                        key={b}
                        to={`/products?brand=${encodeURIComponent(b)}`}
                        onClick={closeMobile}
                        style={{ padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', background: 'var(--bg-secondary)' }}
                      >
                        {b}
                      </Link>
                    ))}
                    <Link
                      to="/products"
                      onClick={closeMobile}
                      style={{ padding: '0.6rem', fontSize: '0.9rem', textAlign: 'center', background: 'var(--accent)', color: 'white' }}
                    >
                      All
                    </Link>
                  </>
                ) : (
                  <div style={{ opacity: 0.7 }}>No brands found</div>
                )}
              </div>

              <div className="drawer-section-title">Navigation</div>
              <div className="drawer-links">
                <NavLink to="/" onClick={closeMobile}>Home</NavLink>
                <NavLink to="/products" onClick={closeMobile}>Products</NavLink>
                {user ? <NavLink to="/admin/dashboard" onClick={closeMobile}>Admin Dashboard</NavLink> : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
