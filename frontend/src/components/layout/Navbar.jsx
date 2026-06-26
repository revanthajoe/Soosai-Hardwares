import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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

          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
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

            {user ? <NavLink to="/admin/dashboard" onClick={closeMobile}>Admin</NavLink> : null}
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
  );
}

export default Navbar;
