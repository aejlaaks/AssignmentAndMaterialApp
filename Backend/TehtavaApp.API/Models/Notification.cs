namespace TehtavaApp.API.Models;

using System.ComponentModel.DataAnnotations.Schema;

public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public NotificationType Type { get; set; }
    
    [NotMapped] // Tämä ominaisuus ei ole tietokannassa
    public NotificationPriority Priority { get; set; } = NotificationPriority.Medium;
    
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public int? RelatedId { get; set; }
    public int? CourseId { get; set; }
    public int? GroupId { get; set; }

    // Navigation properties
    public virtual ApplicationUser User { get; set; }
    public virtual Course Course { get; set; }
    public virtual SchoolGroup Group { get; set; }
    public virtual NotificationMetadata Metadata { get; set; }

    public Notification()
    {
        CreatedAt = DateTime.UtcNow;
        IsRead = false;
    }

    public void MarkAsRead()
    {
        if (!IsRead)
        {
            IsRead = true;
            ReadAt = DateTime.UtcNow;
        }
    }
}
