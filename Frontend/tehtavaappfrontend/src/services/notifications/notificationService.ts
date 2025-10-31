import axios from 'axios';
import { type Notification, type NotificationPreferences, type PaginatedResponse, NotificationType, NotificationPriority } from '../../types';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

interface GetNotificationsParams {
  types?: string[];
  priority?: string[];
  read?: boolean;
  archived?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

// Mock data for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Assignment',
    message: 'You have a new assignment in Math course',
    type: NotificationType.Info,
    priority: NotificationPriority.High,
    isRead: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    metadata: {
      courseId: '1',
      courseName: 'Mathematics',
      assignmentId: '101'
    }
  },
  {
    id: '2',
    title: 'Assignment Graded',
    message: 'Your Physics assignment has been graded',
    type: NotificationType.Success,
    priority: NotificationPriority.Medium,
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    metadata: {
      courseId: '2',
      courseName: 'Physics',
      assignmentId: '102',
      grade: '85'
    }
  },
  {
    id: '3',
    title: 'Course Enrollment',
    message: 'You have been enrolled in History course',
    type: NotificationType.Info,
    priority: NotificationPriority.Low,
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    metadata: {
      courseId: '3',
      courseName: 'History'
    }
  }
];

// Mock preferences
const mockPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  enrolledCoursesOnly: true, // Default to only show notifications for enrolled courses
  enabledTypes: [NotificationType.Info, NotificationType.Success, NotificationType.Warning, NotificationType.Error],
  enabledPriorities: [NotificationPriority.High, NotificationPriority.Medium, NotificationPriority.Low]
};

export const getNotifications = async (params?: GetNotificationsParams): Promise<PaginatedResponse<Notification>> => {
  try {
    // Try to get real data from API
    const response = await api.get<PaginatedResponse<Notification>>('/notification', { params });
    
    // Apply filters based on preferences
    if (response.data && response.data.items) {
      let filteredItems = [...response.data.items];
      
      // Filter by enrolled courses if enabled
      if (mockPreferences.enrolledCoursesOnly) {
        // In a real implementation, we would get the user's enrolled courses from the API
        // For now, we'll just use a mock list of enrolled course IDs
        const enrolledCourseIds = ['1', '2']; // Mock enrolled course IDs (Math and Physics)
        
        // Filter the notifications to only include those from enrolled courses
        filteredItems = filteredItems.filter(notification => {
          // Check if the notification has a courseId in the metadata
          if (notification.metadata && notification.metadata.courseId) {
            // Check if the courseId is in the list of enrolled course IDs
            return enrolledCourseIds.includes(notification.metadata.courseId);
          }
          // If the notification doesn't have a courseId, include it (system notifications)
          return true;
        });
      }
      
      // Filter by enabled notification types
      if (mockPreferences.enabledTypes && mockPreferences.enabledTypes.length > 0) {
        filteredItems = filteredItems.filter(notification => 
          mockPreferences.enabledTypes?.includes(notification.type)
        );
      }
      
      // Filter by enabled priority levels
      if (mockPreferences.enabledPriorities && mockPreferences.enabledPriorities.length > 0) {
        filteredItems = filteredItems.filter(notification => 
          mockPreferences.enabledPriorities?.includes(notification.priority)
        );
      }
      
      // Update the response with filtered items
      response.data.items = filteredItems;
      response.data.totalItems = filteredItems.length;
    }
    
    return response.data;
  } catch (error) {
    console.warn('Using mock notification data due to API error:', error);
    
    // Filter mock data based on params
    let filteredNotifications = [...mockNotifications];
    
    if (params?.read !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === params.read);
    }
    
    if (params?.archived !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isArchived === params.archived);
    }
    
    // Apply filters based on preferences
    
    // Filter by enrolled courses if enabled
    if (mockPreferences.enrolledCoursesOnly) {
      // In a real implementation, we would get the user's enrolled courses from the API
      // For now, we'll just use a mock list of enrolled course IDs
      const enrolledCourseIds = ['1', '2']; // Mock enrolled course IDs (Math and Physics)
      
      // Filter the notifications to only include those from enrolled courses
      filteredNotifications = filteredNotifications.filter(notification => {
        // Check if the notification has a courseId in the metadata
        if (notification.metadata && notification.metadata.courseId) {
          // Check if the courseId is in the list of enrolled course IDs
          return enrolledCourseIds.includes(notification.metadata.courseId);
        }
        // If the notification doesn't have a courseId, include it (system notifications)
        return true;
      });
    }
    
    // Filter by enabled notification types
    if (mockPreferences.enabledTypes && mockPreferences.enabledTypes.length > 0) {
      filteredNotifications = filteredNotifications.filter(notification => 
        mockPreferences.enabledTypes?.includes(notification.type)
      );
    }
    
    // Filter by enabled priority levels
    if (mockPreferences.enabledPriorities && mockPreferences.enabledPriorities.length > 0) {
      filteredNotifications = filteredNotifications.filter(notification => 
        mockPreferences.enabledPriorities?.includes(notification.priority)
      );
    }
    
    // Return mock data in the expected format
    return {
      items: filteredNotifications,
      currentPage: 1,
      totalPages: 1,
      totalItems: filteredNotifications.length
    };
  }
};

export const getNotification = async (id: string): Promise<Notification> => {
  try {
    const response = await api.get<Notification>(`/notification/${id}`);
    return response.data;
  } catch (error) {
    console.warn('Using mock notification data due to API error:', error);
    const notification = mockNotifications.find(n => n.id === id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.post(`/notification/${notificationId}/read`);
  } catch (error) {
    console.warn('Using mock markAsRead due to API error:', error);
    // Update the mock notification in memory
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      mockNotifications[index] = {
        ...mockNotifications[index],
        isRead: true
      };
    }
  }
};

// Archive functionality is not implemented in the backend
// This is a mock implementation that only works with mock data
export const archive = async (id: string): Promise<void> => {
  console.warn('Archive functionality is not implemented in the backend');
  // Update the mock notification in memory
  const index = mockNotifications.findIndex(n => n.id === id);
  if (index !== -1) {
    mockNotifications[index] = {
      ...mockNotifications[index],
      isArchived: true
    };
  }
};

export const remove = async (id: string): Promise<void> => {
  try {
    await api.delete(`/notification/${id}`);
  } catch (error) {
    console.warn('Using mock remove due to API error:', error);
    // Remove the notification from the mock data
    const index = mockNotifications.findIndex(n => n.id === id);
    if (index !== -1) {
      mockNotifications.splice(index, 1);
    }
  }
};

export const getPreferences = async (): Promise<NotificationPreferences> => {
  try {
    console.log('Fetching notification preferences from API');
    const response = await api.get<any[]>('/notification/preferences');
    console.log('Raw preferences from API:', response.data);
    
    // Map backend preferences to frontend format
    // The backend returns an array of preferences with type, channel, and isEnabled
    // Start with default values from mockPreferences to ensure we have sensible defaults
    const preferences: NotificationPreferences = {
      ...mockPreferences
    };
    
    // Process each preference from the backend
    if (Array.isArray(response.data)) {
      response.data.forEach(pref => {
        console.log('Processing preference:', pref);
        // Map channels to our frontend properties
        if (pref.channel === 1) { // Email
          preferences.emailNotifications = pref.isEnabled;
        } else if (pref.channel === 2) { // Push
          preferences.pushNotifications = pref.isEnabled;
        } else if (pref.channel === 0) { // InApp (using for SMS in our frontend)
          preferences.smsNotifications = pref.isEnabled;
        }
      });
    }
    
    console.log('Mapped preferences:', preferences);
    return preferences;
  } catch (error) {
    console.warn('Using mock preferences due to API error:', error);
    // Käytetään mockPreferences-objektia, kun API-kutsu epäonnistuu
    console.log('Returning mock preferences:', mockPreferences);
    return { ...mockPreferences };
  }
};

export const updatePreferences = async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
  try {
    console.log('Updating preferences with:', preferences);
    
    // Map frontend preferences to backend format
    // The backend expects individual updates for each channel
    const updatePromises = [];
    
    if (preferences.emailNotifications !== undefined) {
      const emailPayload = {
        type: 0, // System (default type)
        channel: 1, // Email (NotificationChannel.Email = 1)
        isEnabled: preferences.emailNotifications
      };
      console.log('Email preference update payload:', emailPayload);
      updatePromises.push(
        api.put('/notification/preferences', emailPayload)
      );
    }
    
    if (preferences.pushNotifications !== undefined) {
      const pushPayload = {
        type: 0, // System (default type)
        channel: 2, // Push (NotificationChannel.Push = 2)
        isEnabled: preferences.pushNotifications
      };
      console.log('Push preference update payload:', pushPayload);
      updatePromises.push(
        api.put('/notification/preferences', pushPayload)
      );
    }
    
    if (preferences.smsNotifications !== undefined) {
      // SMS might not be directly supported in the backend enum
      // Using a custom channel value that might need to be added to the backend
      const smsPayload = {
        type: 0, // System (default type)
        channel: 0, // InApp (NotificationChannel.InApp = 0)
        isEnabled: preferences.smsNotifications
      };
      console.log('SMS preference update payload:', smsPayload);
      updatePromises.push(
        api.put('/notification/preferences', smsPayload)
      );
    }
    
    // Päivitetään mockPreferences-objektia, koska backend-API ei tue näitä asetuksia
    if (preferences.enrolledCoursesOnly !== undefined) {
      // This is a custom preference that might need to be added to the backend
      console.log('Enrolled courses only preference:', preferences.enrolledCoursesOnly);
      mockPreferences.enrolledCoursesOnly = preferences.enrolledCoursesOnly;
    }
    
    if (preferences.enabledTypes !== undefined) {
      // Store the enabled notification types
      console.log('Enabled notification types:', preferences.enabledTypes);
      mockPreferences.enabledTypes = preferences.enabledTypes;
    }
    
    if (preferences.enabledPriorities !== undefined) {
      // Store the enabled notification priorities
      console.log('Enabled notification priorities:', preferences.enabledPriorities);
      mockPreferences.enabledPriorities = preferences.enabledPriorities;
    }
    
    // Execute all updates
    if (updatePromises.length > 0) {
      console.log('Executing', updatePromises.length, 'preference updates');
      const results = await Promise.all(updatePromises);
      console.log('Update results:', results);
    } else {
      console.log('No preference updates to execute');
    }
    
    // Get updated preferences
    console.log('Fetching updated preferences');
    const updatedPrefs = await getPreferences();
    console.log('Returning updated preferences:', updatedPrefs);
    return updatedPrefs;
  } catch (error) {
    console.error('Error updating preferences:', error);
    console.warn('Using mock preferences update due to API error');
    
    // Päivitetään mockPreferences-objektia
    if (preferences.emailNotifications !== undefined) {
      mockPreferences.emailNotifications = preferences.emailNotifications;
    }
    if (preferences.pushNotifications !== undefined) {
      mockPreferences.pushNotifications = preferences.pushNotifications;
    }
    if (preferences.smsNotifications !== undefined) {
      mockPreferences.smsNotifications = preferences.smsNotifications;
    }
    if (preferences.enrolledCoursesOnly !== undefined) {
      mockPreferences.enrolledCoursesOnly = preferences.enrolledCoursesOnly;
    }
    if (preferences.enabledTypes !== undefined) {
      mockPreferences.enabledTypes = preferences.enabledTypes;
    }
    if (preferences.enabledPriorities !== undefined) {
      mockPreferences.enabledPriorities = preferences.enabledPriorities;
    }
    
    // Return updated mock preferences
    console.log('Returning mock updated preferences:', mockPreferences);
    return { ...mockPreferences };
  }
};

export const markAllAsRead = async (): Promise<void> => {
  try {
    await api.post('/notification/read-all');
  } catch (error) {
    console.warn('Using mock markAllAsRead due to API error:', error);
    // Mark all mock notifications as read
    mockNotifications.forEach(notification => {
      notification.isRead = true;
    });
  }
};

// Archive functionality is not implemented in the backend
// This is a mock implementation that only works with mock data
export const archiveAll = async (): Promise<void> => {
  console.warn('Archive functionality is not implemented in the backend');
  // Mark all mock notifications as archived
  mockNotifications.forEach(notification => {
    notification.isArchived = true;
  });
};

export const deleteAll = async (): Promise<void> => {
  try {
    await api.delete('/notification');
  } catch (error) {
    console.warn('Using mock deleteAll due to API error:', error);
    // Clear all mock notifications
    mockNotifications.length = 0;
  }
};

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  link?: string;
  sourceId?: string;
  sourceType?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  sourceId?: string;
  sourceType?: string;
}

class NotificationService {
  async getNotifications(): Promise<INotification[]> {
    const response = await api.get<INotification[]>('/notification');
    return response.data;
  }

  async getUnreadNotifications(): Promise<INotification[]> {
    const response = await api.get<INotification[]>('/notification/unread');
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notification/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.post('/notification/read-all');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notification/${notificationId}`);
  }

  async createNotification(notification: CreateNotificationRequest): Promise<INotification> {
    const response = await api.post<INotification>('/notification', notification);
    return response.data;
  }

  async createSubmissionNotification(
    teacherId: string,
    studentName: string,
    assignmentTitle: string,
    assignmentId: string,
    submissionId: string
  ): Promise<INotification> {
    const notification: CreateNotificationRequest = {
      userId: teacherId,
      title: 'Uusi tehtäväpalautus',
      message: `${studentName} on palauttanut tehtävän "${assignmentTitle}"`,
      type: 'info',
      link: `/submissions/${submissionId}`,
      sourceId: assignmentId,
      sourceType: 'Assignment'
    };
    
    return this.createNotification(notification);
  }
}

export const notificationService = new NotificationService();

export const sendCourseNotification = async (
  courseId: number,
  title: string,
  message: string,
  type: NotificationType = NotificationType.Info,
  priority: NotificationPriority = NotificationPriority.Medium
): Promise<void> => {
  try {
    console.log(`Lähetetään kurssi-ilmoitus kurssille ${courseId}`);
    await api.post(`/notification/course/${courseId}`, {
      title,
      message,
      type,
      priority
    });
    console.log('Kurssi-ilmoitus lähetetty onnistuneesti');
  } catch (error) {
    console.error('Virhe kurssi-ilmoituksen lähettämisessä:', error);
    throw new Error('Kurssi-ilmoituksen lähettäminen epäonnistui');
  }
};
