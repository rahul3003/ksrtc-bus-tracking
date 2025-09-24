import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    // Redirect to appropriate dashboard based on user role
    const roleRoutes = {
      DRIVER: '/driver',
      PASSENGER: '/passenger'
    };
    
    return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
  }

  return children;
};

export default AdminRoute;
