import axios, { AxiosError } from 'axios';

/**
 * Interface for API error response
 */
interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Interface for formatted API error
 */
export interface FormattedApiError {
  message: string;
  status?: number;
  validationErrors?: Record<string, string>;
  isAuthError?: boolean;
  isNetworkError?: boolean;
}

/**
 * Formats an API error consistently
 * @param error The error from axios
 * @param defaultMessage Default message to show if error doesn't have a message
 * @returns Formatted error object
 */
export function formatApiError(error: unknown, defaultMessage = 'An error occurred'): FormattedApiError {
  // Log the error for debugging
  console.error('API Error:', error);
  
  const formattedError: FormattedApiError = {
    message: defaultMessage,
  };
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    
    // Add status code if available
    if (axiosError.response) {
      formattedError.status = axiosError.response.status;
    }
    
    // Authentication errors
    if (axiosError.response?.status === 401) {
      formattedError.message = 'Authentication required. Please log in.';
      formattedError.isAuthError = true;
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      
      return formattedError;
    }
    
    // Permission errors
    if (axiosError.response?.status === 403) {
      formattedError.message = 'You do not have permission to perform this action.';
      return formattedError;
    }
    
    // Validation errors
    if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
      formattedError.message = 'Please correct the validation errors.';
      
      // Format validation errors
      const validationErrors: Record<string, string> = {};
      const responseErrors = axiosError.response.data.errors;
      
      Object.entries(responseErrors).forEach(([field, messages]) => {
        validationErrors[field] = Array.isArray(messages) 
          ? messages[0] 
          : typeof messages === 'string' 
            ? messages 
            : 'Invalid value';
      });
      
      formattedError.validationErrors = validationErrors;
      return formattedError;
    }
    
    // Server errors
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      formattedError.message = 'Server error. Please try again later.';
      return formattedError;
    }
    
    // Use error message from response if available
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === 'string') {
        formattedError.message = axiosError.response.data;
      } else if (axiosError.response.data.message) {
        formattedError.message = axiosError.response.data.message;
      } else if (axiosError.response.data.error) {
        formattedError.message = axiosError.response.data.error;
      }
    }
    
    // Network errors
    if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
      formattedError.message = 'Network error. Please check your connection and try again.';
      formattedError.isNetworkError = true;
      return formattedError;
    }
  } else if (error instanceof Error) {
    // Handle regular JavaScript errors
    formattedError.message = error.message || defaultMessage;
  }
  
  return formattedError;
}

/**
 * Throws a formatted API error
 * @param error The error from axios
 * @param defaultMessage Default message to show if error doesn't have a message
 * @throws Formatted error object
 */
export function throwApiError(error: unknown, defaultMessage = 'An error occurred'): never {
  throw formatApiError(error, defaultMessage);
}

/**
 * Extracts validation errors from an API error
 * @param error The error from axios
 * @returns Object with field names as keys and error messages as values
 */
export function extractValidationErrors(error: unknown): Record<string, string> {
  const formattedError = formatApiError(error);
  return formattedError.validationErrors || {};
} 