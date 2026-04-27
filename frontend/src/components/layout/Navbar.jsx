import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../services/auth';

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = auth.getUser();

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
