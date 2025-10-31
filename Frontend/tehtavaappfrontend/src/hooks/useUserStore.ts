import { useState, useCallback, useEffect } from 'react';
import { User } from '../types/User';
import { authService } from '../services/auth/authService';

/**
 * Hook for managing user data and state
 * 
 * Provides methods for user authentication and profile management
 */
export const useUserStore = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Map service user data to our User type
   */
  const mapToUserType = useCallback((userData: any): User => {
    return {
      id: userData.id,
      username: userData.username || userData.email || '',
      email: userData.email,
      displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      role: userData.role?.toLowerCase(),
      token: userData.token,
      createdAt: typeof userData.createdAt === 'string' ? userData.createdAt : undefined,
      updatedAt: typeof userData.updatedAt === 'string' ? userData.updatedAt : undefined
    };
  }, []);

  /**
   * Initialize user from local storage on mount
   */
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(mapToUserType(userData));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
      }
    }
  }, [mapToUserType]);

  /**
   * Login user
   */
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // The authService expects email not username
      const result = await authService.login({ email: username, password });
      
      // Store user in local storage and state
      const mappedUser = mapToUserType(result);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      setUser(mappedUser);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [mapToUserType]);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout
  };
}; 