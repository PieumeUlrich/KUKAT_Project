import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // wait for auth check

  // If already logged in, send to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}