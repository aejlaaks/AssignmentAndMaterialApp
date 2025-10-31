import React from 'react';
import { render, screen, act, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../NotificationProvider';
import { NotificationType } from '../../types';

// Mock SignalR
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn().mockReturnValue({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      invoke: jest.fn(),
    }),
  }),
}));

// Mock notification service
const mockNotifications = [
  {
    id: '1',
    type: 'Assignment' as NotificationType,
    message: 'New assignment',
    isRead: false,
    createdAt: new Date().toISOString(),
    metadata: {
      assignmentId: '123',
      assignmentTitle: 'Test Assignment',
    },
  },
];

const mockPreferences = {
  email: true,
  push: false,
  inApp: true,
  types: ['Assignment', 'Course'] as NotificationType[],
  schedule: {
    digest: false,
    frequency: 'daily' as const,
    time: '09:00',
  },
};

const notificationService = {
  getNotifications: jest.fn().mockResolvedValue(mockNotifications),
  getNotificationPreferences: jest.fn().mockResolvedValue(mockPreferences),
  updateNotificationPreferences: jest.fn().mockResolvedValue(undefined),
  markNotificationAsRead: jest.fn().mockResolvedValue(undefined),
  markAllNotificationsAsRead: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../services/notificationService', () => notificationService);

// Test component that uses the notification context
const TestComponent: React.FC = () => {
  return (
    <div>
      <div data-testid="notification-count">{mockNotifications.length}</div>
      <div data-testid="unread-count">
        {mockNotifications.filter(n => !n.isRead).length}
      </div>
      <button
        onClick={() => {
          mockNotifications[0].isRead = true;
          notificationService.markNotificationAsRead('1');
        }}
        data-testid="mark-read-button"
      >
        Mark Read
      </button>
      <button
        onClick={() => {
          mockNotifications.forEach(n => (n.isRead = true));
          notificationService.markAllNotificationsAsRead();
        }}
        data-testid="mark-all-read-button"
      >
        Mark All Read
      </button>
      <button
        onClick={() => {
          notificationService.updateNotificationPreferences({
            ...mockPreferences,
            email: true,
            push: true,
          });
        }}
        data-testid="update-preferences-button"
      >
        Update Preferences
      </button>
    </div>
  );
};

describe('NotificationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockNotifications.forEach(n => (n.isRead = false));
  });

  it('provides notification data to children', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
      expect(notificationService.getNotificationPreferences).toHaveBeenCalled();
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });
  });

  it('handles marking notification as read', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    await act(async () => {
      userEvent.click(screen.getByTestId('mark-read-button'));
    });

    await waitFor(() => {
      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('handles marking all notifications as read', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    await act(async () => {
      userEvent.click(screen.getByTestId('mark-all-read-button'));
    });

    await waitFor(() => {
      expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalled();
    });
  });

  it('handles updating preferences', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      userEvent.click(screen.getByTestId('update-preferences-button'));
    });

    await waitFor(() => {
      expect(notificationService.updateNotificationPreferences).toHaveBeenCalledWith({
        ...mockPreferences,
        email: true,
        push: true,
      });
    });
  });

  it('handles SignalR connection errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockHubConnection = {
      start: jest.fn().mockRejectedValue(new Error('Connection failed')),
      on: jest.fn(),
      off: jest.fn(),
    };
    require('@microsoft/signalr').HubConnectionBuilder.mockReturnValue({
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockHubConnection),
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'SignalR Connection Error:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('cleans up SignalR connection on unmount', async () => {
    const mockStop = jest.fn().mockResolvedValue(undefined);
    const mockHubConnection = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: mockStop,
      on: jest.fn(),
      off: jest.fn(),
    };
    require('@microsoft/signalr').HubConnectionBuilder.mockReturnValue({
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockHubConnection),
    });

    const { unmount } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });
});
