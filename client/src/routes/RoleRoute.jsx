import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Restricts a subtree of routes to specific roles, e.g.:
//   <Route element={<RoleRoute allowed={['admin']} />}>
//     <Route path="/admin/*" element={<AdminLayout />} />
//   </Route>
// Mirrors the backend's authorize(...roles) middleware, but again —
// this only hides UI. Actual data access is enforced server-side.
const RoleRoute = ({ allowed = [] }) => {
  const { role } = useAuth();

  if (!allowed.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
