import { useAuthState, useAuthActions } from './useRedux';
import { type User, type LoginCredentials } from '../types';

/**
 * @deprecated Use useAuthState and useAuthActions directly for better performance.
 * This hook combines useAuthState and useAuthActions for backward compatibility.
 */
export const useAuth = () => {
  const { user, isLoading, error } = useAuthState();
  const { login, logout, updateProfile } = useAuthActions();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    updateProfile
  };
};
