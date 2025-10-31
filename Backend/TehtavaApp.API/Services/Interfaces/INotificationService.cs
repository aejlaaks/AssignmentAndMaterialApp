using TehtavaApp.API.Models;
using TehtavaApp.API.DTOs;

namespace TehtavaApp.API.Services.Interfaces;

/// <summary>
/// Service interface for managing notifications and notification preferences
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Creates a new notification and sends real-time updates
    /// </summary>
    Task<Notification> CreateNotificationAsync(Notification notification);

    /// <summary>
    /// Creates a new notification with the specified parameters and sends real-time updates
    /// </summary>
    Task<Notification> CreateNotificationAsync(
        string userId,
        string title,
        string message,
        NotificationType type,
        int? relatedId = null,
        int? courseId = null,
        int? groupId = null,
        NotificationMetadata metadata = null);

    /// <summary>
    /// Gets all notifications for a user with pagination, optionally filtered to unread only
    /// </summary>
    Task<PaginatedList<Notification>> GetUserNotificationsAsync(
        string userId,
        bool unreadOnly = false,
        int page = 1,
        int pageSize = 10,
        string sortBy = "createdAt",
        bool sortDescending = true);

    /// <summary>
    /// Gets a specific notification by ID
    /// </summary>
    Task<Notification> GetNotificationByIdAsync(int id);

    /// <summary>
    /// Marks a notification as read and sends real-time updates
    /// </summary>
    Task<bool> MarkAsReadAsync(int id);

    /// <summary>
    /// Marks all notifications for a user as read and sends real-time updates
    /// </summary>
    Task<bool> MarkAllAsReadAsync(string userId);

    /// <summary>
    /// Deletes a specific notification and updates unread count if needed
    /// </summary>
    Task<bool> DeleteNotificationAsync(int id);

    /// <summary>
    /// Deletes all notifications for a user and sends real-time updates
    /// </summary>
    Task<bool> DeleteAllNotificationsAsync(string userId);

    /// <summary>
    /// Gets notification preferences for a specific notification type
    /// </summary>
    Task<NotificationPreference> GetUserPreferencesAsync(string userId, NotificationType type);

    /// <summary>
    /// Gets all notification preferences for a user
    /// </summary>
    Task<IEnumerable<NotificationPreference>> GetAllUserPreferencesAsync(string userId);

    /// <summary>
    /// Updates notification preferences and sends real-time updates
    /// </summary>
    Task<NotificationPreference> UpdateUserPreferencesAsync(
        string userId,
        NotificationType type,
        NotificationChannel channel,
        bool isEnabled);

    /// <summary>
    /// Checks if notifications are enabled for a specific type and channel
    /// </summary>
    Task<bool> IsNotificationEnabledAsync(
        string userId,
        NotificationType type,
        NotificationChannel channel);

    /// <summary>
    /// Gets the count of unread notifications for a user
    /// </summary>
    Task<int> GetUnreadCountAsync(string userId);

    /// <summary>
    /// Sends an email notification to a user
    /// </summary>
    Task<bool> SendEmailNotificationAsync(string userId, string subject, string body);
    
    /// <summary>
    /// Sends an email notification directly to an email address
    /// </summary>
    Task<bool> SendEmailDirectAsync(string email, string subject, string body);
    
    /// <summary>
    /// Sends an email notification for a returned assignment
    /// </summary>
    Task<bool> SendAssignmentReturnedEmailAsync(AssignmentSubmission submission);
    
    /// <summary>
    /// Sends an email notification for a graded assignment
    /// </summary>
    Task<bool> SendAssignmentGradedEmailAsync(AssignmentSubmission submission);
    
    /// <summary>
    /// Sends an email notification for a new assignment
    /// </summary>
    Task<bool> SendNewAssignmentEmailAsync(Assignment assignment, string studentId);

    /// <summary>
    /// Sends an email notification for a submitted assignment
    /// </summary>
    Task<bool> SendAssignmentSubmittedEmailAsync(AssignmentSubmission submission);

    /// <summary>
    /// Sends a push notification to a user
    /// </summary>
    Task<bool> SendPushNotificationAsync(string userId, string title, string message);

    /// <summary>
    /// Sends a course notification to a user
    /// </summary>
    Task<bool> SendCourseNotificationAsync(
        int courseId,
        string title,
        string message,
        NotificationType type,
        NotificationPriority priority = NotificationPriority.Medium);
}

/// <summary>
/// Represents a paginated list of items
/// </summary>
public class PaginatedList<T>
{
    public List<T> Items { get; set; }
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore { get; set; }

    public PaginatedList(List<T> items, int total, int page, int pageSize)
    {
        Items = items;
        Total = total;
        Page = page;
        PageSize = pageSize;
        HasMore = (page * pageSize) < total;
    }
}
