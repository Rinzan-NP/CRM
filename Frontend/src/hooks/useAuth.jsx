import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state) => state.auth);
  const isAuthenticated = !!auth.token;
  return { ...auth, isAuthenticated };
};