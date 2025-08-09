import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state) => state.auth);
  console.log(auth);
  
  const isAuthenticated = !!auth.token;
  return { ...auth, isAuthenticated };
};