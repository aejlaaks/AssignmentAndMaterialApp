import axios from 'axios';
import { API_BASE_URL } from '../config';
import { APP_CONFIG } from '../config';

// Create a new Axios instance with default config
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
httpClient.interceptors.request.use(
  (config) => {
    // Try both token keys - there's a discrepancy in the codebase
    const authServiceToken = localStorage.getItem('auth_token');
    const configToken = localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
    const token = authServiceToken || configToken;
    
    // If token exists, add it to Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
      
      // Debug which token was found
      if (authServiceToken) console.log('Using token from authService key');
      if (configToken) console.log('Using token from APP_CONFIG key');
    } else {
      console.warn('No auth token found for request:', config.url);
      // Debug: show all localStorage keys
      console.log('Available localStorage keys:', 
        Object.keys(localStorage)
          .filter(key => !key.includes('debug'))
          .join(', '));
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - redirecting to login');
      // You could handle logout or redirect here
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient; 