import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export default function AuthGuard({ children }) {
  const { user, isLoading } = useApp();
  const location = useLocation();

  // Let SplashScreen handle the loading state
  if (isLoading) {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
