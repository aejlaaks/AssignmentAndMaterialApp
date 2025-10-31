import axios, { AxiosError } from 'axios';

/**
 * Standard error response from the API
 */
export interface ApiErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

/**
 * Handles API errors in a consistent way
 * @param error The error from axios
 * @param defaultMessage Default message to show if error doesn't have a message
 * @returns Never returns normally, always throws an error
 */
export function handleApiError(error: unknown, defaultMessage = 'An error occurred'): never {
  console.error('API Error:', error);
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    // Handle authentication errors
    if (axiosError.response?.status === 401) {
      // Redirect to login if not authenticated
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      throw new Error('Authentication required. Please log in.');
    }
    
    // Handle forbidden errors
    if (axiosError.response?.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    // Handle validation errors
    if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
      const validationErrors = axiosError.response.data.errors;
      const firstError = Object.values(validationErrors)[0]?.[0];
      throw new Error(firstError || 'Validation error');
    }
    
    // Handle other errors with response
    if (axiosError.response?.data?.message) {
      throw new Error(axiosError.response.data.message);
    }
    
    // Handle network errors
    if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    // Handle other HTTP errors
    if (axiosError.response?.status) {
      const statusMessages: Record<number, string> = {
        400: 'Bad request. Please check your input.',
        404: 'Resource not found.',
        500: 'Server error. Please try again later.',
        503: 'Service unavailable. Please try again later.'
      };
      
      const message = statusMessages[axiosError.response.status] || 
        `Error ${axiosError.response.status}: ${axiosError.response.statusText}`;
      
      throw new Error(message);
    }
  }
  
  // Handle non-axios errors
  if (error instanceof Error) {
    throw error;
  }
  
  // Handle unknown errors
  throw new Error(defaultMessage);
}

/**
 * Extracts validation errors from an API error response
 * @param error The error from axios
 * @returns Object with field names as keys and error messages as values
 */
export function extractValidationErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
      const validationErrors = axiosError.response.data.errors;
      const result: Record<string, string> = {};
      
      // Convert array of errors for each field to a single string
      Object.entries(validationErrors).forEach(([field, errors]) => {
        result[field] = errors[0] || 'Invalid value';
      });
      
      return result;
    }
  }
  
  return {};
} 