import { type FC } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  thickness?: number;
  message?: string;
  fullScreen?: boolean;
  sx?: SxProps<Theme>;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = 40,
  thickness = 4,
  message = 'Ladataan...',
  fullScreen = false,
  sx,
}) => {
  const containerStyles: SxProps<Theme> = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    p: 3,
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    }),
    ...sx,
  };

  return (
    <Box sx={containerStyles}>
      <CircularProgress
        size={size}
        thickness={thickness}
        aria-label="Ladataan sisältöä"
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};
