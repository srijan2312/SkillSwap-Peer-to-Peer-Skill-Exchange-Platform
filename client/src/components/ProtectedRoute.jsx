import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Wraps protected routes: waits for the session check, then redirects
// anonymous visitors to /login.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <Loader label="Checking your session…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
