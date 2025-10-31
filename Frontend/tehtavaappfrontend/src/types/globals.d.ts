// Global declarations for TypeScript
import * as React from 'react';

declare global {
  interface Window {
    React?: typeof React;
    ENV?: {
      API_URL?: string;
      SIGNALR_URL?: string;
      APP_VERSION?: string;
    };
  }
}

export {}; 