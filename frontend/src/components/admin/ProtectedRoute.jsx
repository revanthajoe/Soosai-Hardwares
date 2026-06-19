import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../../services/auth';
import { api } from '../../services/api';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'denied'

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      setStatus('denied');
      return;
    }

    // Verify the stored token is still valid
    api.health()
      .then(() => setStatus('ok'))
      .catch(() => {
        auth.clearSession();
        setStatus('denied');
      });
  }, []);

  if (status === 'checking') {
    return <div className="container page-gap" style={{ textAlign: 'center', padding: '4rem' }}>Verifying session...</div>;
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
