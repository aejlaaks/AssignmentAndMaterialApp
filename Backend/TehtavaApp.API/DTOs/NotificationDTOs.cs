using TehtavaApp.API.Models;
using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.DTOs;

public class NotificationDTO
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public string Type { get; set; }
    public string Priority { get; set; }
    public bool IsRead { get; set; }
    public string CreatedAt { get; set; }
    public string ReadAt { get; set; }
    public int? RelatedId { get; set; }
    public int? CourseId { get; set; }
    public string CourseName { get; set; }
    public int? GroupId { get; set; }
    public string GroupName { get; set; }
    public NotificationMetadataDTO Metadata { get; set; }
}

public class NotificationMetadataDTO
{
    public string Title { get; set; }
    public string Description { get; set; }
    public string Url { get; set; }
    public string ImageUrl { get; set; }
    public List<NotificationActionDTO> Actions { get; set; }
}

public class NotificationActionDTO
{
    public string Label { get; set; }
    public string Url { get; set; }
    public string Type { get; set; }
}

public class NotificationCountDTO
{
    public int UnreadCount { get; set; }
}

public class NotificationPreferenceDTO
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string Type { get; set; }
    public string Channel { get; set; }
    public bool IsEnabled { get; set; }
}

public class PaginatedNotificationsDTO
{
    public List<NotificationDTO> Items { get; set; }
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public bool HasMore { get; set; }
}

public class CreateCourseNotificationDTO
{
    [Required]
    public string Title { get; set; }
    
    [Required]
    public string Message { get; set; }
    
    public NotificationType Type { get; set; } = NotificationType.Course;
    
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
}

public class PaginatedResponseDTO<T>
{
    public List<T> Items { get; set; }
    public int TotalItems { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public bool HasMore { get; set; }
}

public class UpdateNotificationPreferenceDTO
{
    [Required]
    public NotificationType Type { get; set; }
    
    [Required]
    public NotificationChannel Channel { get; set; }
    
    [Required]
    public bool IsEnabled { get; set; }
}

public static class NotificationExtensions
{
    public static NotificationDTO ToDTO(this Notification notification)
    {
        return new NotificationDTO
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            Priority = notification.Priority.ToString(),
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt.ToString("o"),
            ReadAt = notification.ReadAt?.ToString("o"),
            RelatedId = notification.RelatedId,
            CourseId = notification.CourseId,
            CourseName = notification.Course?.Name,
            GroupId = notification.GroupId,
            GroupName = notification.Group?.Name,
            Metadata = notification.Metadata?.ToDTO()
        };
    }

    public static NotificationMetadataDTO ToDTO(this NotificationMetadata metadata)
    {
        if (metadata == null)
            return null;

        return new NotificationMetadataDTO
        {
            Title = metadata.Title,
            Description = metadata.Description,
            Url = metadata.Url,
            ImageUrl = metadata.ImageUrl,
            Actions = metadata.Actions?.Select(a => new NotificationActionDTO
            {
                Label = a.Label,
                Url = a.Url,
                Type = a.Type
            }).ToList()
        };
    }

    public static NotificationPreferenceDTO ToDTO(this NotificationPreference preference)
    {
        return new NotificationPreferenceDTO
        {
            Id = preference.Id,
            UserId = preference.UserId,
            Type = preference.Type.ToString(),
            Channel = preference.Channel.ToString(),
            IsEnabled = preference.IsEnabled
        };
    }
}
