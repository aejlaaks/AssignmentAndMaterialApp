import { type FC, useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import { NotificationList } from '../components/notifications/NotificationList';
import { PageHeader } from '../components/ui/PageHeader';
import { useNotificationContext } from '../components/notifications/NotificationProvider';
import { type NotificationType, type NotificationPriority } from '../types';

// Debug component to show raw notification data
const DebugPanel: FC<{ notifications: any[] }> = ({ notifications }) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Button 
        startIcon={<BugReportIcon />} 
        variant="outlined" 
        color="info" 
        size="small"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide Debug Info' : 'Show Debug Info'}
      </Button>
      <Collapse in={open}>
        <Paper sx={{ p: 2, mt: 1, maxHeight: 300, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2">Raw Notification Data</Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(notifications, null, 2)}
          </pre>
        </Paper>
      </Collapse>
    </Box>
  );
};

export const Notifications: FC = () => {
  const {
    notifications,
    archiveAllNotifications,
    markAllAsRead
  } = useNotificationContext();

  const [currentFilters, setCurrentFilters] = useState<{
    types: NotificationType[];
    priority: NotificationPriority[];
    read?: boolean;
    archived?: boolean;
    startDate?: Date;
    endDate?: Date;
  }>({
    types: [],
    priority: [],
  });

  const handleArchiveAll = useCallback(async () => {
    await archiveAllNotifications();
  }, [archiveAllNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Ilmoitukset"
        action={{
          label: 'Merkitse kaikki luetuiksi',
          onClick: handleMarkAllRead,
          disabled: notifications.length === 0,
        }}
      />

      {/* Debug panel for troubleshooting */}
      <DebugPanel notifications={notifications} />

      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ width: 280, flexShrink: 0 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bulk Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleArchiveAll}
              disabled={notifications.length === 0}
              fullWidth
            >
              Archive All
            </Button>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <NotificationList
            emptyMessage="No notifications match your filters"
            showActions={true}
            maxHeight="none"
          />
        </Box>
      </Box>
    </Container>
  );
};
