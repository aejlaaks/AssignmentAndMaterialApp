import { useSelector, useDispatch } from 'react-redux';
import { login as loginAction, logout as logoutAction, updateProfile as updateProfileAction } from '../store/slices/authSlice';
import { type User, type LoginCredentials } from '../types';
import { isTokenExpired, handleTokenExpiration } from '../utils/auth';
import { RootState, AppDispatch } from '../store';

/**
 * Hook to access auth state from Redux store
 */
export const useAuthState = () => {
  const auth = useSelector((state: RootState) => state.auth);
  return auth;
};

/**
 * Hook to access auth actions from Redux store
 */
export const useAuthActions = () => {
  const dispatch = useDispatch<AppDispatch>();
  return {
    login: (credentials: LoginCredentials) => dispatch(loginAction(credentials)),
    logout: () => dispatch(logoutAction()),
    updateProfile: (user: User) => dispatch(updateProfileAction(user))
  };
};

/**
 * Hook to access auth status including token expiration check
 */
export const useAuthStatus = () => {
  const { user, isLoading, error } = useAuthState();
  const token = localStorage.getItem('token');

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.warn('Token is expired in useAuthStatus, redirecting to login');
    handleTokenExpiration(window.location.pathname);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Token expired'
    };
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error
  };
};

/**
 * Returns the entire app state
 * Useful for debugging or when you need the whole state
 */
export const useAppState = () => useSelector((state: RootState) => state);

/**
 * Returns the course state
 */
export const useCourseState = () => useSelector((state: RootState) => state.courses);

/**
 * Returns the notification state
 */
export const useNotificationState = () => useSelector((state: RootState) => state.notifications);

/**
 * Returns the UI state 
 */
export const useUIState = () => useSelector((state: RootState) => state.ui); 