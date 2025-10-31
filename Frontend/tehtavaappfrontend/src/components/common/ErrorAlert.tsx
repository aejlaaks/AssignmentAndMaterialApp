import { type FC } from 'react';
import { Alert, AlertTitle, Box, type SxProps, type Theme } from '@mui/material';

interface ErrorAlertProps {
  message: string | null;
  title?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  sx?: SxProps<Theme>;
  onClose?: () => void;
}

export const ErrorAlert: FC<ErrorAlertProps> = ({
  message,
  title = 'Virhe',
  severity = 'error',
  sx,
  onClose,
}) => {
  if (!message) return null;

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Alert severity={severity} onClose={onClose}>
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};
