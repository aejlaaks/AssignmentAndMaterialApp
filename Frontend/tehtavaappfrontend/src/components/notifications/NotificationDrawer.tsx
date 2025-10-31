import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  DeleteSweep as ArchiveAllIcon
} from '@mui/icons-material';
import { NotificationList } from './NotificationList';
import { useNotificationContext } from './NotificationProvider';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  width = 350
}) => {
  const { notifications, archiveAllNotifications } = useNotificationContext();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;

  const handleArchiveAll = () => {
    archiveAllNotifications();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: width,
          maxWidth: '100%'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge badgeContent={unreadCount} color="primary" sx={{ mr: 1 }}>
            <NotificationsIcon color="action" />
          </Badge>
          <Typography variant="h6">
            Ilmoitukset ({totalCount})
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Arkistoi kaikki">
            <span>
              <IconButton 
                onClick={handleArchiveAll} 
                sx={{ mr: 1 }}
                disabled={totalCount === 0}
              >
                <ArchiveAllIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Sulje">
            <IconButton onClick={onClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 2, height: 'calc(100% - 64px)', overflow: 'hidden' }}>
        <NotificationList 
          maxHeight="calc(100vh - 100px)" 
          emptyMessage="Ei ilmoituksia. Uudet ilmoitukset näkyvät tässä."
        />
      </Box>
    </Drawer>
  );
};

export default NotificationDrawer; 