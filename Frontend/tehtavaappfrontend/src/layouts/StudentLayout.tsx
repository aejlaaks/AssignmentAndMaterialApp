import { type FC } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { NotificationMenu } from '../components/notifications/NotificationMenu';
import { useNotifications } from '../hooks/useNotifications';
import { type Notification } from '../types';

const drawerWidth = 240;

// Student-specific menu items
const menuItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'My Courses', icon: <SchoolIcon />, path: '/courses' },
  { label: 'My Assignments', icon: <AssignmentIcon />, path: '/assignments' },
  { label: 'My Submissions', icon: <HistoryIcon />, path: '/submissions' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export const StudentLayout: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    archiveNotification,
    markAllAsRead,
    archiveAll,
    error,
    isLoading,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (notification.metadata?.url) {
      navigate(notification.metadata.url);
    }
  };

  const handleSettingsClick = () => {
    navigate('/settings/notifications');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: theme.palette.primary.main, // Student theme color
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            TehtäväApp - Student Portal
          </Typography>
          <NotificationMenu
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationClick}
            onArchiveClick={archiveNotification}
            onMarkAllRead={markAllAsRead}
            onArchiveAll={archiveAll}
            onSettingsClick={handleSettingsClick}
            loading={isLoading}
            error={error}
            sx={{
              marginRight: theme.spacing(2),
            }}
          />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  {item.path === '/notifications' ? (
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error"
                      max={99}
                      showZero={false}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                
                {item.path === '/notifications' && unreadCount > 0 && (
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error"
                    max={99}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
