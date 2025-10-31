import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Paper,
  Box,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  Button
} from '@mui/material';
import {
  CheckCircleOutline as ReadIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  DeleteSweep as DeleteAllIcon
} from '@mui/icons-material';
import { Notification, NotificationType } from '../../types';
import { getNotificationIcon, getNotificationColor } from '../../utils/notificationUtils';
import { useNotificationContext } from './NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';

interface NotificationListProps {
  maxHeight?: string | number;
  showActions?: boolean;
  emptyMessage?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  maxHeight = 400,
  showActions = true,
  emptyMessage = 'Ei ilmoituksia'
}) => {
  const { notifications, markNotificationAsRead, archiveNotification, archiveAllNotifications } = useNotificationContext();

  if (!notifications || notifications.length === 0) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const handleArchive = (id: string) => {
    archiveNotification(id);
  };

  const handleArchiveAll = () => {
    archiveAllNotifications();
  };

  return (
    <Paper>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<DeleteAllIcon />}
          onClick={handleArchiveAll}
          sx={{ mb: 1 }}
        >
          Arkistoi kaikki
        </Button>
      </Box>
      <Divider />
      <List sx={{ maxHeight, overflow: 'auto' }}>
        {notifications.map((notification, index) => {
          const NotificationTypeIcon = getNotificationIcon(notification.type);
          const typeColor = getNotificationColor(notification.type);
          const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
            addSuffix: true,
            locale: fi 
          });

          return (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ListItemIcon sx={{ color: typeColor, minWidth: 40 }}>
                  <NotificationTypeIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="div">
                        {notification.title}
                        {!notification.isRead && (
                          <Badge
                            color="primary"
                            variant="dot"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timeAgo}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 0.5, mb: 0.5 }}
                    >
                      {notification.message}
                    </Typography>
                  }
                />
                {showActions && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {!notification.isRead && (
                      <Tooltip title="Merkitse luetuksi">
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(notification.id)}
                          sx={{ color: 'primary.main' }}
                        >
                          <ReadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Arkistoi">
                      <IconButton
                        size="small"
                        onClick={() => handleArchive(notification.id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};

export default NotificationList;
