import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAuth();
  if (!isConnected) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
