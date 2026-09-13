import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Blocks access to any nested route unless a user is logged in.
// This is a UX convenience only — the real gate is the backend's
// protect() middleware. Someone could disable this in devtools and
// still get nothing, because every API call would 401.
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // could render a spinner here

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
