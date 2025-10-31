import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import localforage from 'localforage';
import { API_URL } from '../utils/apiConfig';
import { isTokenExpired, handleTokenExpiration } from '../utils/auth';

// Global API client with default configuration
const createApiClient = (config: AxiosRequestConfig = {}): AxiosInstance => {
  const token = localStorage.getItem('token');

  // Create axios instance
  const instance = axios.create({
    ...config,
    baseURL: config.baseURL || API_URL || 'http://localhost:5001/api',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
    }
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Check token on each request
      const currentToken = localStorage.getItem('token');
      
      // Check if token is expired before making the request
      if (currentToken && isTokenExpired(currentToken)) {
        console.warn('Token is expired, redirecting to login');
        handleTokenExpiration(window.location.pathname);
        return Promise.reject(new Error('Token expired'));
      }
      
      if (currentToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        // Handle unauthorized errors (e.g., token expired)
        console.log('Unauthorized: Redirecting to login');
        handleTokenExpiration(window.location.pathname);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createApiClient; 