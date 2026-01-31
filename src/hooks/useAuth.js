import { useAppSelector } from './storeHooks';

export const useAuth = () => {
  const { user, isLoading, isError, isSuccess, message } = useAppSelector((state) => state.auth);
  
  return {
    user,
    isLoading,
    isError,
    isSuccess,
    message,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client' || user?.role === 'portal',
  };
};
