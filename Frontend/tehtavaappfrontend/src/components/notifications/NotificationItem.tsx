import { type FC } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  type SxProps,
  type Theme,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { type Notification, NotificationType, NotificationPriority } from '../../types';
import { getNotificationIcon, getNotificationColor } from '../../utils/notificationUtils';

// Define an interface for notification actions
interface NotificationAction {
  label: string;
  url?: string;
  icon?: React.ReactNode;
}
import {
  formatNotificationDate,
  formatNotificationMessage,
  getPriorityColor,
} from '../../utils/notificationUtils';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onActionClick?: () => void;
  onArchiveClick?: () => void;
  onDeleteClick?: () => void;
  showActions?: boolean;
  sx?: SxProps<Theme>;
}

export const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  onClick,
  onActionClick,
  onArchiveClick,
  onDeleteClick,
  showActions = true,
  sx,
}) => {
  // Handle potential missing fields in the API response
  const safeNotification = {
    ...notification,
    type: notification.type || NotificationType.Info,
    priority: notification.priority || NotificationPriority.Medium,
    isRead: notification.isRead !== undefined ? notification.isRead : false,
    isArchived: notification.isArchived !== undefined ? notification.isArchived : false,
    createdAt: notification.createdAt || new Date().toISOString(),
    metadata: notification.metadata || {}
  };

  const NotificationTypeIcon = getNotificationIcon(safeNotification.type);
  const typeColor = getNotificationColor(safeNotification.type);
  const priorityColor = getPriorityColor(safeNotification.priority);

  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          bgcolor: onClick ? 'action.hover' : 'transparent',
        },
        borderLeft: !safeNotification.isRead ? `4px solid ${priorityColor}` : undefined,
        ...sx,
      }}
      onClick={onClick}
    >
      <ListItemIcon sx={{ color: typeColor, minWidth: 40 }}>
        <NotificationTypeIcon />
      </ListItemIcon>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" component="span">
              {safeNotification.title}
            </Typography>
            {!safeNotification.isRead && (
              <CircleIcon
                sx={{ fontSize: 8, color: priorityColor }}
              />
            )}
          </Box>
        }
        secondary={
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ display: 'block' }}
            >
              {safeNotification.message || formatNotificationMessage(safeNotification)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {formatNotificationDate(safeNotification.createdAt)}
            </Typography>
            {safeNotification.metadata?.actions && onActionClick && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                {safeNotification.metadata.actions.map((action: NotificationAction, index: number) => (
                  <IconButton
                    key={index}
                    size="small"
                    aria-label={action.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionClick();
                    }}
                    sx={{ mr: 1 }}
                  >
                    {action.icon}
                  </IconButton>
                ))}
              </Box>
            )}
          </>
        }
      />

      {showActions && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onArchiveClick && (
            <IconButton
              size="small"
              aria-label="archive"
              onClick={(e) => {
                e.stopPropagation();
                onArchiveClick();
              }}
            >
              <ArchiveIcon fontSize="small" />
            </IconButton>
          )}
          {onDeleteClick && (
            <IconButton
              size="small"
              aria-label="delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </ListItem>
  );
};
