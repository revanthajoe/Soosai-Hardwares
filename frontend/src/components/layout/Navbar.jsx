import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../services/auth';
import { api } from '../../services/api';

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = auth.getUser();
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await api.getBrands();
        setBrands(res.data || []);
      } catch (err) {
        console.error('Failed to load brands', err);
      } finally {
        setLoadingBrands(false);
      }
    };
    loadBrands();
  }, []);

  const handleLogout = () => {
    auth.clearSession();
    navigate('/admin/login');
  };

  return (
    <header className="top-nav">
      <div className="container nav-wrap">
        <Link to="/" className="brand">
          ⚙️ Soosai Hardwares
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          
          <div className="nav-dropdown">
            <span className="nav-dropdown-trigger">Brands ▾</span>
            <div className="nav-dropdown-content">
              {loadingBrands ? (
                <div style={{ padding: '0.6rem 1rem', opacity: 0.7 }}>Loading...</div>
              ) : brands.length > 0 ? (
                <>
                  {brands.map((b) => (
                    <Link key={b} to={`/products?brand=${encodeURIComponent(b)}`}>
                      {b}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.2rem 0' }}></div>
                  <Link to="/products" className="view-all-brands">
                    View All Products
                  </Link>
                </>
              ) : (
                <div style={{ padding: '0.6rem 1rem', opacity: 0.7 }}>Loading...</div>
              )}
            </div>
          </div>

          {user ? <NavLink to="/admin/dashboard">Admin</NavLink> : null}
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {user ? (
            <button className="ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link to="/admin/login" className="button-link">
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
