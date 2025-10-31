import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  children: React.ReactNode;
  fullPage?: boolean;
  transparent?: boolean;
}

/**
 * A loading overlay component that displays a spinner and optional message
 * over its children when the loading prop is true.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message = 'Ladataan...',
  children,
  fullPage = false,
  transparent = false
}) => {
  const theme = useTheme();

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      
      <Box
        sx={{
          position: fullPage ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: transparent 
            ? 'rgba(255, 255, 255, 0.7)' 
            : theme.palette.background.paper,
          zIndex: theme.zIndex.modal,
          backdropFilter: transparent ? 'blur(2px)' : 'none'
        }}
      >
        <CircularProgress size={48} />
        {message && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoadingOverlay; 