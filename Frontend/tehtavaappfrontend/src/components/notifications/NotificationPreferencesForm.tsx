import { type FC, useState, useEffect } from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Button,
  type SxProps,
  type Theme,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  NotificationType,
  NotificationPriority,
  type NotificationPreferences,
  type NotificationChannel,
} from '../../types';

// Simple loading spinner component
const LoadingSpinner: FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
    <CircularProgress />
  </Box>
);

// Simple error alert component
interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  sx?: SxProps<Theme>;
}

const ErrorAlert: FC<ErrorAlertProps> = ({ message, onClose, sx }) => (
  <Alert severity="error" onClose={onClose} sx={sx}>
    {message}
  </Alert>
);

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences | null;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  sx?: SxProps<Theme>;
}

interface PreferenceSection {
  label: string;
  key: keyof NotificationPreferences;
  description?: string;
  type: 'boolean' | 'array';
}

const preferenceSections: PreferenceSection[] = [
  {
    label: 'Email Notifications',
    key: 'emailNotifications',
    description: 'Receive notifications via email',
    type: 'boolean',
  },
  {
    label: 'Push Notifications',
    key: 'pushNotifications',
    description: 'Receive notifications on your device',
    type: 'boolean',
  },
  {
    label: 'In-App Notifications',
    key: 'enrolledCoursesOnly',
    description: 'Only receive notifications about materials and assignments for courses you are enrolled in',
    type: 'boolean',
  },
];

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  enrolledCoursesOnly: true, // Default to only show notifications for enrolled courses
  enabledTypes: [NotificationType.Info, NotificationType.Success, NotificationType.Warning, NotificationType.Error],
  enabledPriorities: [NotificationPriority.High, NotificationPriority.Medium, NotificationPriority.Low]
};

export const NotificationPreferencesForm: FC<NotificationPreferencesFormProps> = ({
  preferences,
  onSave,
  isLoading = false,
  error = null,
  onClearError,
  sx,
}) => {
  const [formState, setFormState] = useState<NotificationPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setFormState(preferences);
    }
  }, [preferences]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleChannelToggle = (key: keyof NotificationPreferences) => {
    setFormState((prev: NotificationPreferences) => {
      // Check if the property is a boolean
      if (typeof prev[key] === 'boolean') {
        return {
          ...prev,
          [key]: !prev[key]
        };
      }
      // For other types, just return the previous state
      return prev;
    });
  };

  const handleSoundToggle = () => {
    // Sound toggle is not part of the NotificationPreferences type
    console.log('Sound toggle is not implemented');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formState);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(formState);

  return (
    <Box sx={{ ...sx }}>
      {error && (
        <ErrorAlert
          message={error}
          onClose={onClearError}
          sx={{ mb: 2 }}
        />
      )}

      <Typography variant="h6" gutterBottom>
        Notification Channels
      </Typography>

      {preferenceSections.map((section) => (
        <Box key={String(section.key)} sx={{ mb: 3 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={typeof formState[section.key] === 'boolean' ? formState[section.key] as boolean : false}
                  onChange={() => handleChannelToggle(section.key)}
                  disabled={isSaving}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">{section.label}</Typography>
                  {section.description && (
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          </FormGroup>
        </Box>
      ))}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        sx={{ mt: 2 }}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Box>
  );
};
