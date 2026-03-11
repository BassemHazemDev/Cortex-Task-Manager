import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export default function AuthGuard({ children }) {
  const { user, isLoading } = useApp();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen serene-gradient flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Cortex
          </div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
