import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../services/auth';

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!auth.isLoggedIn()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
