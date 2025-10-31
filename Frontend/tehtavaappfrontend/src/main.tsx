import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import theme from './theme';
import App from './App';
import './index.css';
import './styles/markdown.css';
import { ServiceProvider } from './contexts/ServiceContext';
// Import auth utilities for token synchronization
import './utils/auth';

// Ensure React is globally available to avoid initialization issues
// This is critical for libraries that might use React's hooks
if (typeof window !== 'undefined') {
  window.React = React;
}

// Define a simple root component to isolate provider initialization
const Root = () => (
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ServiceProvider>
          <App />
        </ServiceProvider>
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);

// Get the root element
const rootElement = document.getElementById('root');

// Initialize the application with error handling
if (rootElement) {
  try {
    // Create root and render with appropriate mode
    const root = ReactDOM.createRoot(rootElement);
    
    // Only use StrictMode in development
    if (import.meta.env.DEV) {
      root.render(
        <React.StrictMode>
          <Root />
        </React.StrictMode>
      );
    } else {
      // In production, render without StrictMode to avoid double-initialization
      root.render(<Root />);
    }
  } catch (error) {
    console.error('Failed to render application:', error);
  }
} else {
  console.error('Root element not found');
}
