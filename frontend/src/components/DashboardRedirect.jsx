import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're on the exact root path and user is loaded
    if (!loading && user && location.pathname === '/') {
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'DRIVER':
          navigate('/driver', { replace: true });
          break;
        case 'PASSENGER':
          navigate('/passenger', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    } else if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  );
};

export default DashboardRedirect;
