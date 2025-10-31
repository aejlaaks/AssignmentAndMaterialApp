import { type Notification, NotificationType, NotificationPriority } from '../types';

export interface NotificationParams {
  type?: NotificationType[];
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

import { 
  Assignment as AssignmentIcon,
  Book as BookIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Grade as GradeIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import React from 'react';

export const getNotificationIcon = (type: NotificationType): React.ElementType => {
  const icons: Record<string, React.ElementType> = {
    [NotificationType.Info]: InfoIcon,
    [NotificationType.Success]: SuccessIcon,
    [NotificationType.Warning]: WarningIcon,
    [NotificationType.Error]: ErrorIcon,
    [NotificationType.Assignment]: AssignmentIcon,
    [NotificationType.AssignmentSubmitted]: AssignmentIcon,
    [NotificationType.Group]: GroupIcon,
    [NotificationType.Course]: SchoolIcon,
    [NotificationType.Material]: BookIcon,
    [NotificationType.System]: SettingsIcon
  };
  return icons[type] || NotificationsIcon;
};

export const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<string, string> = {
    [NotificationType.Info]: '#1976d2', // blue
    [NotificationType.Success]: '#2e7d32', // green
    [NotificationType.Warning]: '#ed6c02', // orange
    [NotificationType.Error]: '#d32f2f', // red
    [NotificationType.Assignment]: '#7b1fa2', // purple
    [NotificationType.AssignmentSubmitted]: '#0288d1', // light blue
    [NotificationType.Group]: '#00796b', // teal
    [NotificationType.Course]: '#1565c0', // dark blue
    [NotificationType.Material]: '#538300', // olive green
    [NotificationType.System]: '#455a64' // blue grey
  };
  return colors[type] || '#757575'; // grey default
};

export const getPriorityColor = (priority: NotificationPriority): string => {
  const colors: Record<string, string> = {
    [NotificationPriority.High]: '#d32f2f', // red
    [NotificationPriority.Medium]: '#ed6c02', // orange
    [NotificationPriority.Low]: '#2e7d32', // green
  };
  return colors[priority];
};

export const formatNotificationDate = (date: string): string => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInHours = Math.abs(now.getTime() - notificationDate.getTime()) / 36e5;

  if (diffInHours < 24) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      -Math.round(diffInHours),
      'hour'
    );
  }

  if (diffInHours < 48) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(notificationDate);
};

export const formatNotificationMessage = (notification: Notification): string => {
  const { type, metadata, message } = notification;

  // If the notification has a message, use it directly
  if (message) {
    return message;
  }

  // Otherwise, fall back to type-based defaults
  switch (type) {
    case NotificationType.Info:
      return metadata?.message || 'Information notification';
    case NotificationType.Success:
      return metadata?.message || 'Success notification';
    case NotificationType.Warning:
      return metadata?.message || 'Warning notification';
    case NotificationType.Error:
      return metadata?.message || 'Error notification';
    case NotificationType.Assignment:
      return metadata?.message || 'Assignment notification';
    case NotificationType.AssignmentSubmitted:
      return metadata?.message || 'New submission received';
    case NotificationType.Group:
      return metadata?.message || 'Group notification';
    case NotificationType.Course:
      return metadata?.message || 'Course notification';
    case NotificationType.Material:
      return metadata?.message || 'Material notification';
    case NotificationType.System:
      return metadata?.message || 'System notification';
    default:
      return metadata?.message || 'New notification';
  }
};

export const filterNotifications = (
  notifications: Notification[],
  params: NotificationParams
): Notification[] => {
  return notifications.filter((notification) => {
    if (params.type && !params.type.includes(notification.type)) {
      return false;
    }
    if (params.priority && notification.priority !== params.priority) {
      return false;
    }
    if (params.isRead !== undefined && notification.isRead !== params.isRead) {
      return false;
    }
    if (params.isArchived !== undefined && notification.isArchived !== params.isArchived) {
      return false;
    }
    if (params.startDate && new Date(notification.createdAt) < new Date(params.startDate)) {
      return false;
    }
    if (params.endDate && new Date(notification.createdAt) > new Date(params.endDate)) {
      return false;
    }
    return true;
  });
};
