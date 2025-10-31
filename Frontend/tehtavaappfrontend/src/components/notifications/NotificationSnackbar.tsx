import { type FC, forwardRef, type ForwardRefRenderFunction } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  type SnackbarProps,
  type AlertProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { type Notification, NotificationPriority } from '../../types';
import { getNotificationIcon, getNotificationColor } from '../../utils/notificationUtils';

interface NotificationSnackbarProps extends Omit<SnackbarProps, 'onClose'> {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
  autoHideDuration?: number;
  variant?: AlertProps['variant'];
  elevation?: number;
  sx?: SxProps<Theme>;
}

const NotificationSnackbarBase: ForwardRefRenderFunction<HTMLDivElement, NotificationSnackbarProps> = ({
  notification,
  onClose,
  onAction,
  autoHideDuration = 6000,
  variant = 'filled',
  elevation = 6,
  sx,
  ...snackbarProps
}, ref) => {
  const NotificationTypeIcon = getNotificationIcon(notification.type);
  const typeColor = getNotificationColor(notification.type);

  return (
    <Snackbar
      ref={ref}
      open={true}
      autoHideDuration={autoHideDuration}
      onClose={(event, reason) => {
        if (reason === 'clickaway') return;
        onClose();
      }}
      {...snackbarProps}
    >
      <Alert
        variant={variant}
        elevation={elevation}
        icon={<NotificationTypeIcon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {notification.metadata?.actions?.map((action, index) => (
              <IconButton
                key={index}
                size="small"
                aria-label={action.label}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.();
                }}
                sx={{ color: 'inherit' }}
              >
                {action.icon}
              </IconButton>
            ))}
            <IconButton
              size="small"
              aria-label="close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          width: '100%',
          backgroundColor: typeColor,
          '& .MuiAlert-icon': {
            alignItems: 'center',
          },
          ...sx,
        }}
      >
        <Box>
          <Typography variant="subtitle2" component="div">
            {notification.title}
          </Typography>
          <Typography variant="body2" color="inherit">
            {notification.message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export const NotificationSnackbar = forwardRef<HTMLDivElement, NotificationSnackbarProps>(NotificationSnackbarBase);

NotificationSnackbar.displayName = 'NotificationSnackbar';
