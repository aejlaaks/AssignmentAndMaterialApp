/**
 * Gets the authentication header for API requests
 * @returns Object with Authorization header or empty object if no token
 */
export const getAuthHeader = () => {
  // Check all possible token storage locations
  const authToken = localStorage.getItem('authToken');
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  
  const tokenToUse = token || authToken;
  
  if (tokenToUse) {
    return { Authorization: `Bearer ${tokenToUse}` };
  }
  return {};
};

/**
 * Synchronizes tokens between different storage locations
 * to ensure consistent authentication regardless of which key is used
 */
export const synchronizeTokens = () => {
  // Get tokens from all possible locations
  const authToken = localStorage.getItem('authToken');
  const auth_token = localStorage.getItem('auth_token');
  const token = localStorage.getItem('token');
  
  // Determine which token to use (prefer auth_token since that's what authService uses)
  const tokenToUse = auth_token || authToken || token;
  
  if (tokenToUse) {
    // Store the token in all locations
    localStorage.setItem('auth_token', tokenToUse);
    localStorage.setItem('authToken', tokenToUse);
    localStorage.setItem('token', tokenToUse);
    
    console.log('Token synchronized across storage locations');
  } else {
    console.warn('No token found to synchronize');
  }
};

/**
 * Checks if a JWT token is expired
 * @param token The JWT token to check
 * @returns boolean indicating if the token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return true;
    }
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check if the token has an expiration claim
    if (!payload.exp) {
      console.warn('Token has no expiration claim');
      return true;
    }
    
    // Convert expiration timestamp to milliseconds and compare with current time
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Add a 5-minute buffer to prevent edge cases
    const isExpired = currentTime >= expirationTime - 5 * 60 * 1000;
    
    if (isExpired) {
      console.warn('Token is expired or will expire soon');
    }
    
    return isExpired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Handles token expiration by clearing auth data and redirecting to login
 * @param redirectTo Optional path to redirect to after login
 */
export const handleTokenExpiration = (redirectTo?: string): void => {
  console.log('Handling token expiration');
  
  // Clear all auth data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('current_user');
  localStorage.removeItem('user');
  
  // Redirect to login page with return URL if provided
  const loginUrl = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';
  window.location.href = loginUrl;
};

// Run synchronization on module import
synchronizeTokens(); 