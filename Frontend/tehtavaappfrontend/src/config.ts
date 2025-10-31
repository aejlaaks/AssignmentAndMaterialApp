// Määritellään window.ENV-tyyppi
declare global {
  interface Window {
    ENV?: {
      API_URL?: string;
      SIGNALR_URL?: string;
      APP_VERSION?: string;
    };
  }
}

// API configuration
export const API_BASE_URL = 
  // First try to use runtime-injected environment variables (for Docker/production)
  window.ENV?.API_URL || 
  // Then try to use build-time environment variables
  import.meta.env.VITE_API_URL || 
  // Default to localhost for development
  'https://localhost:5001';

// Log the API URL for debugging
console.log('Using API_BASE_URL:', API_BASE_URL);

// Application configuration
export const APP_CONFIG = {
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  
  // Date format for display
  DATE_FORMAT: 'DD.MM.YYYY HH:mm',
  SHORT_DATE_FORMAT: 'DD.MM.YYYY',
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.jpg', '.jpeg', '.png'],
  
  // Notification settings
  NOTIFICATION_DISPLAY_TIME: 5000, // 5 seconds
  
  // Authentication
  TOKEN_STORAGE_KEY: 'token',
  USER_STORAGE_KEY: 'user',
  
  // Feature flags
  FEATURES: {
    ENABLE_RUBRICS: true,
    ENABLE_BATCH_GRADING: true,
    ENABLE_GRADING_HISTORY: true
  }
}; 