using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime LastActive { get; set; }
    public string? PrimaryRole { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Course> TeachingCourses { get; set; }
    public virtual ICollection<StudentGroupEnrollment> GroupEnrollments { get; set; }
    public virtual ICollection<NotificationPreference> NotificationPreferences { get; set; }
    public virtual ICollection<Notification> Notifications { get; set; }
    public virtual ICollection<PushNotificationToken> PushNotificationTokens { get; set; }
    public virtual ICollection<Assignment> CreatedAssignments { get; set; }
    public virtual ICollection<AssignmentSubmission> AssignmentSubmissions { get; set; }
    public virtual ICollection<Material> CreatedMaterials { get; set; }
    public virtual ICollection<CourseTeacher> CoursesAsTeacher { get; set; }

    public ApplicationUser()
    {
        TeachingCourses = new HashSet<Course>();
        GroupEnrollments = new HashSet<StudentGroupEnrollment>();
        NotificationPreferences = new HashSet<NotificationPreference>();
        Notifications = new HashSet<Notification>();
        PushNotificationTokens = new HashSet<PushNotificationToken>();
        CreatedAssignments = new HashSet<Assignment>();
        AssignmentSubmissions = new HashSet<AssignmentSubmission>();
        CreatedMaterials = new HashSet<Material>();
        CoursesAsTeacher = new HashSet<CourseTeacher>();
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        LastActive = DateTime.UtcNow;
    }

    public string FullName => $"{FirstName} {LastName}".Trim();

    public void UpdateLastActive()
    {
        LastActive = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
