import axios, { AxiosError } from 'axios';

/**
 * Handles API errors consistently across the application
 * @param error The error object
 * @param defaultMessage Default message to display if error doesn't have a message
 * @returns Throws the error with a consistent format
 */
export function handleApiError(error: any, defaultMessage: string = 'An error occurred'): never {
  console.error(error);
  
  let errorMessage = defaultMessage;
  
  if (error instanceof Error) {
    errorMessage = error.message || defaultMessage;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = error.message || defaultMessage;
  }
  
  throw new Error(errorMessage);
}

/**
 * Handles API errors consistently
 * @param error The error from the API call
 * @param defaultMessage Default message to use if error details are not available
 * @returns Error with appropriate message
 */
export const handleApiErrorOld = (error: unknown, defaultMessage: string = 'An error occurred'): Error => {
  console.error('API Error:', error);
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Handle different error responses
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = axiosError.response.data as any;
      
      if (data?.message) {
        return new Error(data.message);
      }
      
      if (data?.error) {
        return new Error(data.error);
      }
      
      if (typeof data === 'string') {
        return new Error(data);
      }
      
      return new Error(`${defaultMessage} (${axiosError.response.status})`);
    } else if (axiosError.request) {
      // The request was made but no response was received
      return new Error('No response received from server. Please check your connection.');
    }
  }
  
  // For non-Axios errors or unhandled cases
  if (error instanceof Error) {
    return error;
  }
  
  return new Error(defaultMessage);
}; 