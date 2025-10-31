import React, { createContext, useContext, useCallback, ReactNode, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Notification, NotificationPriority } from '../../types';
import { 
  addNotification, 
  deleteNotification as removeNotification, 
  markAsRead, 
  markAllAsRead, 
  clearNotifications as archiveNotificationAction,
  clearNotifications as archiveAllAction
} from '../../store/slices/notificationSlice';
import { AppDispatch, RootState } from '../../store';
import { NotificationSnackbar } from './NotificationSnackbar';
import { NotificationSound } from './NotificationSound';
import { authService } from '../../services/auth/authService';
import { API_BASE_URL as BASE_URL } from '../../utils/apiConfig';
import { getNotifications } from '../../services/notifications/notificationService';
import * as signalR from '@microsoft/signalr';

// Enable SignalR for real-time notifications
const ENABLE_SIGNALR = true;

// Auto-hide notification after this many milliseconds
const AUTO_HIDE_DURATION = 6000;

export interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  hideNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  archiveNotification: (id: string) => void;
  archiveAllNotifications: () => void;
}

interface NotificationProviderProps {
  children: ReactNode;
  soundEnabled?: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider using Redux for state management
 * 
 * @deprecated This provider now uses Redux under the hood.
 * Consider migrating to useSelector/useDispatch for direct Redux access.
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  soundEnabled = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [playSound, setPlaySound] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date());
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up SignalR connection
  useEffect(() => {
    if (!ENABLE_SIGNALR) return;

    const setupSignalRConnection = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          console.warn('User not logged in, cannot establish SignalR connection');
          return;
        }

        // Build the hub URL using the base API URL
        let hubUrl = `${BASE_URL}/hubs/notifications`;
        
        // Force HTTP for development to avoid SSL errors
        if (import.meta.env.DEV && hubUrl.startsWith('https:')) {
          hubUrl = hubUrl.replace('https:', 'http:');
          console.log('Development environment detected, using HTTP for SignalR:', hubUrl);
        }

        console.log('Setting up SignalR connection to:', hubUrl);

        const connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect()
          .build();

        // Set up event handlers
        connection.on('ReceiveNotification', (notification: Notification) => {
          console.log('Received real-time notification:', notification);
          
          // Ensure notification has all required fields
          const processedNotification = {
            ...notification,
            id: notification.id.toString(), // Ensure ID is a string
            isRead: notification.isRead ?? false,
            isArchived: notification.isArchived ?? false,
          };
          
          showNotification(processedNotification);
          
          // Add notification to the list, avoiding duplicates
          dispatch(addNotification(processedNotification));
        });

        // Start the connection
        try {
          await connection.start();
          console.log('SignalR connection established successfully');
          setHubConnection(connection);

          // Join user-specific groups
          const user = authService.getCurrentUser();
          if (user?.id) {
            await connection.invoke('JoinUserGroup', user.id);
            console.log('Joined user group:', user.id);
          }
        } catch (error) {
          console.error('Error establishing SignalR connection:', error);
          // Don't retry if we get a 405 error - server might not support WebSockets
          if (error instanceof Error && error.message.includes('405')) {
            console.warn('Server responded with 405 Not Allowed. WebSockets may not be supported.');
          }
        }
      } catch (error) {
        console.error('Error establishing SignalR connection:', error);
      }
    };

    setupSignalRConnection();

    // Clean up connection when component unmounts
    return () => {
      if (hubConnection) {
        hubConnection.stop();
        console.log('SignalR connection closed');
      }
    };
  }, [dispatch]);

  // Load initial notifications
  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          console.warn('User not logged in, skipping initial notifications load');
          return;
        }

        console.log('Loading initial notifications...');
        
        const params = {
          archived: false, // Only load non-archived notifications
          page: 1,
          pageSize: 50 // Load more notifications to ensure we have a good history
        };
        
        const notificationsResponse = await getNotifications(params);
        
        if (notificationsResponse.items && notificationsResponse.items.length > 0) {
          // Process each notification to ensure required fields
          const processedNotifications = notificationsResponse.items.map(notification => ({
            ...notification,
            id: notification.id.toString(), // Ensure ID is a string
            type: notification.type || 'Info', // Default to Info type if missing
            isRead: notification.isRead ?? false,
            isArchived: notification.isArchived ?? false,
          }));
          
          // Ensure we don't have duplicates in the initial load
          const uniqueNotifications = processedNotifications.filter(
            (notification, index, self) => 
              index === self.findIndex(n => n.id === notification.id)
          );
          
          uniqueNotifications.forEach(notification => dispatch(addNotification(notification)));
          console.log(`Loaded ${uniqueNotifications.length} initial notifications`);
          
          // Show the most recent unread notification
          const firstUnread = uniqueNotifications.find(n => !n.isRead);
          if (firstUnread) {
            showNotification(firstUnread);
          }
        }
      } catch (error) {
        console.error('Error loading initial notifications:', error);
      }
    };

    loadInitialNotifications();
  }, [dispatch]);

  // Implement polling for notifications as fallback
  useEffect(() => {
    // Skip if SignalR is enabled and connected
    if (ENABLE_SIGNALR && hubConnection) {
      console.log('Using SignalR for notifications, skipping polling');
      return;
    }

    console.log('Setting up notification polling mechanism as fallback');
    
    // Function to poll for new notifications
    const pollForNotifications = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          console.warn('User not logged in, skipping notification poll');
          return;
        }

        console.log('Polling for notifications...');
        
        // Get notifications that are newer than the last check time
        const params = {
          since: lastCheckedTime.toISOString(),
          archived: false // Only get non-archived notifications
        };
        
        const notificationsResponse = await getNotifications(params);
        
        // Process each notification to ensure required fields
        const processedNotifications = (notificationsResponse.items || []).map(notification => ({
          ...notification,
          id: notification.id.toString(), // Ensure ID is a string
          type: notification.type || 'Info', // Default to Info type if missing
          isRead: notification.isRead ?? false,
          isArchived: notification.isArchived ?? false,
        }));
        
        // Update the last checked time
        setLastCheckedTime(new Date());
        
        // Show new notifications
        if (processedNotifications.length > 0) {
          console.log(`Found ${processedNotifications.length} new notifications`);
          // Show the most recent notification
          showNotification(processedNotifications[0]);
          // Add new notifications to the list, avoiding duplicates
          processedNotifications.forEach(notification => dispatch(addNotification(notification)));
        }
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    };
    
    // Poll immediately on mount
    pollForNotifications();
    
    // Set up polling interval (every 30 seconds)
    const pollingInterval = setInterval(pollForNotifications, 30000);
    
    // Clean up on unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, [dispatch]);

  // Auto-hide notification after timeout (but don't mark as read)
  useEffect(() => {
    if (currentNotification) {
      // Clear any existing timer
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
      
      // Set new timer to hide notification only (no auto-mark-as-read)
      autoHideTimerRef.current = setTimeout(() => {
        hideNotification(currentNotification.id);
      }, AUTO_HIDE_DURATION);
    }
    
    // Clean up timer on unmount or when notification changes
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [dispatch, currentNotification]);

  // Show notification
  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const fullNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      priority: notification.priority || NotificationPriority.Medium,
    } as Notification;
    dispatch(addNotification(fullNotification));
  }, [dispatch]);
  
  // Hide notification
  const hideNotification = useCallback((id: string) => {
    dispatch(removeNotification(id));
  }, [dispatch]);
  
  // Mark notification as read
  const markNotificationAsRead = useCallback((id: string) => {
    dispatch(markAsRead(id));
  }, [dispatch]);
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);
  
  // Archive notification
  const archiveNotification = useCallback((id: string) => {
    dispatch(archiveNotificationAction());
  }, [dispatch]);
  
  // Archive all notifications
  const archiveAllNotifications = useCallback(() => {
    dispatch(archiveAllAction());
  }, [dispatch]);

  const handleSoundEnd = useCallback(() => {
    setPlaySound(false);
  }, []);

  const contextValue: NotificationContextValue = {
    notifications,
    showNotification,
    hideNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    archiveNotification,
    archiveAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {currentNotification && (
        <NotificationSnackbar
          notification={currentNotification}
          onClose={() => hideNotification(currentNotification.id)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={AUTO_HIDE_DURATION}
        />
      )}
      <NotificationSound
        play={playSound}
        priority={currentNotification?.priority}
        onEnded={handleSoundEnd}
      />
    </NotificationContext.Provider>
  );
};
