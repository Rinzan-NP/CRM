import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PublicRouter = ({ children, redirectTo = "/" }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default PublicRouter;