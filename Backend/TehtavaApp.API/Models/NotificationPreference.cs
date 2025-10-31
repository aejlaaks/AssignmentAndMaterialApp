namespace TehtavaApp.API.Models;

public class NotificationPreference
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public NotificationType Type { get; set; }
    public NotificationChannel Channel { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public virtual ApplicationUser User { get; set; }

    public NotificationPreference()
    {
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        IsEnabled = true;
    }
}
