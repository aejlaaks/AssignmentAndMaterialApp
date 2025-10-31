import { type FC, useState, useCallback, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  type SxProps,
  type Theme,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { NotificationBadge } from './NotificationBadge';
import { NotificationList } from './NotificationList';
import { type Notification } from '../../types';

interface NotificationMenuProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onArchiveClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
  onArchiveAll: () => void;
  onSettingsClick: () => void;
  loading?: boolean;
  error?: string | null;
  maxHeight?: number | string;
  sx?: SxProps<Theme>;
}

export const NotificationMenu: FC<NotificationMenuProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onArchiveClick,
  onMarkAllRead,
  onArchiveAll,
  onSettingsClick,
  loading = false,
  error = null,
  maxHeight = 400,
  sx,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleOpen = useCallback(() => {
    setAnchorEl(document.activeElement as HTMLElement);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    onNotificationClick(notification);
    handleClose();
  }, [onNotificationClick, handleClose]);

  const handleViewAll = useCallback(() => {
    navigate('/notifications');
  }, [navigate]);

  const handleSettings = useCallback(() => {
    onSettingsClick();
    handleClose();
  }, [onSettingsClick, handleClose]);

  return (
    <Box sx={sx}>
      <NotificationBadge
        count={unreadCount}
        onClick={handleOpen}
        color="error"
        size="large"
        sx={{ color: 'inherit' }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: maxHeight,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6">Ilmoitukset</Typography>
        </Box>

        {unreadCount > 0 && (
          <Box
            sx={{
              px: 2,
              pb: 1,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <MenuItem onClick={onMarkAllRead}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Merkitse kaikki luetuiksi</ListItemText>
            </MenuItem>
            <MenuItem onClick={onArchiveAll}>
              <ListItemIcon>
                <ArchiveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Arkistoi kaikki</ListItemText>
            </MenuItem>
          </Box>
        )}

        <Divider />

        <NotificationList
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onArchiveClick={onArchiveClick}
          isLoading={loading}
          error={error}
          maxHeight={maxHeight}
          emptyMessage="Ei uusia ilmoituksia"
        />

        <Divider />

        <Box sx={{ p: 1 }}>
          <MenuItem onClick={handleViewAll}>
            <ListItemText>Näytä kaikki ilmoitukset</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ilmoitusasetukset</ListItemText>
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
};
