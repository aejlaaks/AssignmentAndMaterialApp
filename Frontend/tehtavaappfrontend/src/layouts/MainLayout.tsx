import { type FC, useState } from 'react';
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
  useMediaQuery,
  CssBaseline,
  type Theme,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  SupervisorAccount as UsersIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Assignment as TestIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthState } from '../hooks/useRedux';
import { type Notification, UserRole } from '../types';
import { cn } from '../utils/styleUtils';
import Logo from '../assets/logo';
import { NotificationDrawer } from '../components/notifications/NotificationDrawer';
import { useNotificationContext } from '../components/notifications/NotificationProvider';

const drawerWidth = 240;

// Define menu items based on user role
const getMenuItems = (userRole: UserRole) => {
  console.log('Building menu items for role:', userRole);
  
  const items = [
    { label: 'Etusivu', icon: <DashboardIcon color="primary" />, path: '/dashboard' },
    { label: 'Kurssit', icon: <SchoolIcon sx={{ color: '#4caf50' }} />, path: '/courses' },
    { label: 'Omat kurssit', icon: <SchoolIcon sx={{ color: '#2196f3' }} />, path: '/my-courses' },
    { label: 'Tehtävät', icon: <AssignmentIcon sx={{ color: '#ff9800' }} />, path: '/assignments' },
  ];

  // Add Test management for teachers and admins
  if (userRole === UserRole.Teacher || userRole === UserRole.Admin) {
    console.log('Adding teacher/admin menu items');
    items.splice(4, 0, { label: 'Tentit', icon: <TestIcon sx={{ color: '#9c27b0' }} />, path: '/tests' });
    
    // Add Groups for teachers and admins
    items.splice(5, 0, { label: 'Ryhmät', icon: <GroupIcon sx={{ color: '#e91e63' }} />, path: '/groups' });
  }

  // Add Materials management for teachers and admins
  if (userRole === UserRole.Teacher || userRole === UserRole.Admin) {
    items.splice(6, 0, { label: 'Materiaalit', icon: <SchoolIcon sx={{ color: '#3f51b5' }} />, path: '/materials' });
  }

  // Add Users and Settings for admins only
  if (userRole === UserRole.Admin) {
    items.push({ label: 'Käyttäjät', icon: <UsersIcon sx={{ color: '#f44336' }} />, path: '/users' });
    items.push({ label: 'Asetukset', icon: <SettingsIcon sx={{ color: 'gray' }} />, path: '/settings' });
  }

  console.log('Final menu items:', items.map(item => item.label).join(', '));
  return items;
};

export const MainLayout: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthState();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  
  const { notifications, markNotificationAsRead, archiveNotification } = useNotificationContext();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = notifications.length;

  // Debug user role information
  console.log('MainLayout: User information:', {
    isLoggedIn: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    userRoleType: user?.role ? typeof user.role : 'undefined'
  });

  // Get menu items based on user role
  const menuItems = getMenuItems(user?.role || UserRole.Student);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationDrawerToggle = () => {
    setNotificationDrawerOpen(!notificationDrawerOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.metadata?.url) {
      navigate(notification.metadata.url);
    }
  };

  const handleSettingsClick = () => {
    navigate('/settings/notifications');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Logo size={32} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            TehtäväApp
          </Typography>
        </Box>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              transition: 'background-color 0.3s',
              bgcolor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
            }}
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
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <Logo size={28} color="#fff" />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Notification Button */}
          <Tooltip title="Ilmoitukset">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationDrawerToggle}
              sx={{ mr: 2 }}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                max={99}
                showZero={false}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* Mobile drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Notification Drawer */}
      <NotificationDrawer 
        open={notificationDrawerOpen} 
        onClose={handleNotificationDrawerToggle} 
      />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* This creates space for the AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};
