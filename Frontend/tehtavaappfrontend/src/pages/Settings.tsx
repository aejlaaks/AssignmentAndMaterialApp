import { type FC, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Stack,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { type NotificationPreferences, NotificationType, NotificationPriority } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Settings: FC = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
  const [tabValue, setTabValue] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    enrolledCoursesOnly: true, // Default to only show notifications for enrolled courses
  });
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<NotificationPriority[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Update local state when preferences are loaded
  useEffect(() => {
    console.log('Preferences changed in Settings component:', preferences);
    if (preferences) {
      console.log('Updating notification settings state with:', preferences);
      setNotificationSettings(preferences);
      
      // Initialize selected types and priorities from preferences
      if (preferences.enabledTypes) {
        setSelectedTypes(preferences.enabledTypes);
      } else {
        // Default to all types if not specified
        setSelectedTypes([
          NotificationType.Info,
          NotificationType.Success,
          NotificationType.Warning,
          NotificationType.Error
        ]);
      }
      
      if (preferences.enabledPriorities) {
        setSelectedPriorities(preferences.enabledPriorities);
      } else {
        // Default to all priorities if not specified
        setSelectedPriorities([
          NotificationPriority.High,
          NotificationPriority.Medium,
          NotificationPriority.Low
        ]);
      }
    }
  }, [preferences]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNotificationToggle = (setting: keyof NotificationPreferences) => {
    console.log(`Toggling ${setting} from`, notificationSettings[setting], 'to', !notificationSettings[setting]);
    setNotificationSettings(prev => {
      const newSettings = {
        ...prev,
        [setting]: !prev[setting],
      };
      console.log('New notification settings state:', newSettings);
      return newSettings;
    });
  };

  const handleSaveNotificationSettings = async () => {
    try {
      console.log('Current notification settings before save:', notificationSettings);
      
      // Create a copy to ensure we're not affected by any reference issues
      const settingsToSave = { 
        ...notificationSettings,
        enabledTypes: selectedTypes,
        enabledPriorities: selectedPriorities
      };
      console.log('Saving notification settings (copy):', settingsToSave);
      
      const updatedPrefs = await updatePreferences(settingsToSave);
      console.log('Settings saved successfully, updated preferences from API:', updatedPrefs);
      
      // Update the UI with the returned preferences
      setNotificationSettings(updatedPrefs);
      
      showSnackbar('Notification settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showSnackbar('Failed to save notification settings', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const notificationTypes: NotificationType[] = [
    NotificationType.Info,
    NotificationType.Success,
    NotificationType.Warning,
    NotificationType.Error,
  ];

  const priorityLevels: NotificationPriority[] = [
    NotificationPriority.High,
    NotificationPriority.Medium,
    NotificationPriority.Low,
  ];

  const handleTypeToggle = (type: NotificationType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handlePriorityToggle = (priority: NotificationPriority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  return (
    <Box>
      <PageHeader title="Asetukset" />
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<AccountIcon />} label="Account" />
          <Tab icon={<PaletteIcon />} label="Appearance" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Notification Channels
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onChange={() => handleNotificationToggle('pushNotifications')}
                    />
                  }
                  label="Push Notifications"
                />
              </FormGroup>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Notification Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {notificationTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => handleTypeToggle(type)}
                    color={selectedTypes.includes(type) ? 'primary' : 'default'}
                    variant={selectedTypes.includes(type) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Priority Levels
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {priorityLevels.map((priority) => (
                  <Chip
                    key={priority}
                    label={priority}
                    onClick={() => handlePriorityToggle(priority)}
                    color={selectedPriorities.includes(priority) ? 'primary' : 'default'}
                    variant={selectedPriorities.includes(priority) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveNotificationSettings}
            >
              Save Notification Settings
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={user?.firstName || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={user?.lastName || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user?.email || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user?.role || ''}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={4}
                    value={user?.bio || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={user?.phoneNumber || ''}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained">
                  Update Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          
          <Card>
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="theme-select-label">Theme</InputLabel>
                <Select
                  labelId="theme-select-label"
                  value="light"
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="font-size-select-label">Font Size</InputLabel>
                <Select
                  labelId="font-size-select-label"
                  value="medium"
                  label="Font Size"
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained">
                  Save Appearance Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Change Password
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained">
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Switch />}
                  label="Enable Two-Factor Authentication"
                />
              </FormGroup>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained">
                  Save Security Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
