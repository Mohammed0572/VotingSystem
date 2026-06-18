import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRole: 'admin' | 'user';
}

const ProtectedRoute = ({ allowedRole }: ProtectedRouteProps) => {
  const { session, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session || session.role !== allowedRole) {
    return <Navigate to={allowedRole === 'admin' ? '/admin-login' : '/'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
