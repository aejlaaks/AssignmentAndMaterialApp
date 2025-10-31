using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TehtavaApp.API.Models;

/// <summary>
/// Represents a push notification token for a user's device
/// </summary>
public class PushNotificationToken
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; }
    
    [Required]
    public string Token { get; set; }
    
    [Required]
    public string DeviceId { get; set; }
    
    /// <summary>
    /// Type of device (e.g., Android, iOS, Web)
    /// </summary>
    public string DeviceType { get; set; }
    
    /// <summary>
    /// Additional device information (e.g., name, model)
    /// </summary>
    public string DeviceInfo { get; set; }
    
    /// <summary>
    /// Whether the token is active
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// When the token was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// When the token was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>
    /// When the token was last used
    /// </summary>
    public DateTime? LastUsedAt { get; set; }
    
    /// <summary>
    /// Navigation property to the user
    /// </summary>
    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; }
    
    /// <summary>
    /// Updates the LastUsedAt timestamp
    /// </summary>
    public void MarkAsUsed()
    {
        LastUsedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// Deactivates the token
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
} 