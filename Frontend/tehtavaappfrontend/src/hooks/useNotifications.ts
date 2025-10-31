import { useState, useEffect, useCallback } from 'react';
import { useNotificationContext } from '../components/notifications/NotificationProvider';
import {
  Notification,
  NotificationType,
  NotificationPreferences,
  NotificationPriority
} from '../types';
import * as notificationService from '../services/notifications/notificationService';
import { authService } from '../services/auth/authService';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../config';

interface NotificationFilters {
  types?: NotificationType[];
  priority?: NotificationPriority[];
  read?: boolean;
  archived?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreferences | null;
  markNotificationAsRead: (notification: Notification) => Promise<void>;
  archiveNotification: (notification: Notification) => Promise<void>;
  deleteNotification: (notification: Notification) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveAll: () => Promise<void>;
  deleteAll: () => Promise<void>;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<NotificationPreferences>;
  handleActionClick: (notification: Notification) => void;
  clearError: () => void;
  joinCourse: (courseId: number) => Promise<void>;
  leaveCourse: (courseId: number) => Promise<void>;
}

export const useNotifications = (): UseNotificationsResult => {
  // Try to use the notification context, but provide a fallback if it's not available
  let notificationContext;
  try {
    notificationContext = useNotificationContext();
  } catch (error) {
    console.warn('NotificationContext not available, using fallback:', error);
    notificationContext = {
      showNotification: () => console.warn('Notification would be shown here'),
      hideNotification: () => {}
    };
  }
  
  const { showNotification } = notificationContext;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  // Luo SignalR-yhteys
  useEffect(() => {
    const createHubConnection = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          console.warn('Käyttäjä ei ole kirjautunut sisään, ei voida luoda SignalR-yhteyttä');
          return;
        }

        // Use the base API URL from configuration and force HTTP in development
        let hubUrl = `${API_BASE_URL}/hubs/notifications`;
        
        // Force HTTP for development to avoid SSL errors
        if (import.meta.env.DEV && hubUrl.startsWith('https:')) {
          hubUrl = hubUrl.replace('https:', 'http:');
          console.log('Development environment detected, using HTTP for SignalR:', hubUrl);
        }

        const newConnection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect()
          .build();

        // Käynnistä yhteys
        await newConnection.start();
        console.log('SignalR-yhteys muodostettu useNotifications-hookissa');
        setConnection(newConnection);

        // Liity käyttäjän kursseihin automaattisesti
        const user = authService.getCurrentUser();
        if (user?.id) {
          await newConnection.invoke('JoinUserGroup', user.id);
          console.log('Liitytty käyttäjäryhmään:', user.id);
        }
      } catch (error) {
        console.error('Virhe SignalR-yhteyden muodostamisessa:', error);
        // Don't retry if we get a 405 error - server might not support WebSockets
        if (error instanceof Error && error.message.includes('405')) {
          console.warn('Palvelin vastasi 405 Not Allowed. WebSockets ei ehkä ole tuettu.');
        }
      }
    };

    createHubConnection();

    // Siivoa yhteys komponentin unmount-vaiheessa
    return () => {
      if (connection) {
        connection.stop();
        console.log('SignalR-yhteys suljettu useNotifications-hookissa');
      }
    };
  }, []);

  const joinCourse = useCallback(async (courseId: number) => {
    if (connection) {
      try {
        // Varmistetaan, että courseId on numero
        const numericCourseId = parseInt(courseId.toString(), 10);
        if (isNaN(numericCourseId)) {
          console.error('Virheellinen kurssin ID:', courseId);
          setError('Virheellinen kurssin ID');
          return;
        }
        
        await connection.invoke('JoinCourse', numericCourseId);
        console.log('Liitytty kurssiin:', numericCourseId);
      } catch (error) {
        console.error('Virhe kurssiin liittymisessä:', error);
        setError('Virhe kurssiin liittymisessä');
      }
    } else {
      console.warn('SignalR-yhteyttä ei ole muodostettu');
    }
  }, [connection]);

  const leaveCourse = useCallback(async (courseId: number) => {
    if (connection) {
      try {
        // Varmistetaan, että courseId on numero
        const numericCourseId = parseInt(courseId.toString(), 10);
        if (isNaN(numericCourseId)) {
          console.error('Virheellinen kurssin ID:', courseId);
          setError('Virheellinen kurssin ID');
          return;
        }
        
        await connection.invoke('LeaveCourse', numericCourseId);
        console.log('Poistuttu kurssilta:', numericCourseId);
      } catch (error) {
        console.error('Virhe kurssilta poistumisessa:', error);
        setError('Virhe kurssilta poistumisessa');
      }
    } else {
      console.warn('SignalR-yhteyttä ei ole muodostettu');
    }
  }, [connection]);

  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching notifications with filters:', filters);
      const response = await notificationService.getNotifications({
        ...filters,
        types: filters?.types?.map(t => t.toString()),
        priority: filters?.priority?.map(p => p.toString()),
      });
      
      console.log('Notifications response:', response);
      
      if (response && response.items) {
        console.log('Setting notifications from items:', response.items);
        setNotifications(response.items);
        setUnreadCount(response.items.filter((n: Notification) => !n.isRead).length);
      } else {
        console.warn('No notifications found in response:', response);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      console.log('Fetching notification preferences');
      const prefs = await notificationService.getPreferences();
      console.log('Setting notification preferences in state:', prefs);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      // Asetetaan virhetilanteessa oletusasetukset, jotta käyttöliittymä toimii
      const defaultPrefs = {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        enrolledCoursesOnly: true,
        enabledTypes: [
          NotificationType.Info,
          NotificationType.Success,
          NotificationType.Warning,
          NotificationType.Error
        ],
        enabledPriorities: [
          NotificationPriority.High,
          NotificationPriority.Medium,
          NotificationPriority.Low
        ]
      };
      console.log('Setting default preferences due to error:', defaultPrefs);
      setPreferences(defaultPrefs);
      // Ei aseteta virheilmoitusta käyttäjälle, koska tämä ei ole kriittinen toiminto
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  const archiveNotification = useCallback(async (notification: Notification) => {
    try {
      await notificationService.archive(notification.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isArchived: true } : n
        )
      );
      if (!notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive notification');
    }
  }, []);

  const deleteNotification = useCallback(async (notification: Notification) => {
    try {
      await notificationService.remove(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, []);

  const archiveAll = useCallback(async () => {
    try {
      await notificationService.archiveAll();
      setNotifications(prev => prev.map(n => ({ ...n, isArchived: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive all notifications');
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all notifications');
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    try {
      console.log('Updating preferences in hook with:', prefs);
      const updatedPrefs = await notificationService.updatePreferences(prefs);
      console.log('Setting updated preferences in state:', updatedPrefs);
      setPreferences(updatedPrefs);
      return updatedPrefs;
    } catch (err) {
      console.error('Error updating preferences in hook:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err; // Re-throw to allow caller to handle the error
    }
  }, []);

  const handleActionClick = useCallback((notification: Notification) => {
    if (notification.metadata?.actions?.[0]?.url) {
      window.location.href = notification.metadata.actions[0].url;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    preferences,
    markNotificationAsRead,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
    archiveAll,
    deleteAll,
    fetchNotifications,
    updatePreferences,
    handleActionClick,
    clearError,
    joinCourse,
    leaveCourse,
  };
};
