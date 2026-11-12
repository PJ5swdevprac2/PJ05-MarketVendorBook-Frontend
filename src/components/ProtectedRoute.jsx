import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

// <ProtectedRoute>                -> any logged-in user
// <ProtectedRoute role="admin">   -> admin only
// <ProtectedRoute role="member">  -> member only
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}