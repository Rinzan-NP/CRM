import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';

const PrivateRouter = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export default PrivateRouter;