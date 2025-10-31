import { authService } from '../services/auth/authService';
import { DEBUG_MODE } from './apiConfig';

/**
 * Hakee autentikaatiotokenin headerit HTTP-pyyntöjä varten
 * @returns Objekti, joka sisältää Authorization-headerin Bearer-tokenilla
 */
export const getAuthHeader = () => {
  const token = authService.getToken();
  
  if (DEBUG_MODE) {
    console.log('Auth token available:', !!token);
    if (!token) {
      console.warn('No authentication token found!');
    }
  }
  
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
}; 