import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            An error occurred while loading this component.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => window.location.reload()}
            sx={{ ml: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide navigation context
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

// Specialized error boundary for lazy-loaded components
export const LazyLoadErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Failed to load component
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            There was a problem loading this part of the application.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary; 