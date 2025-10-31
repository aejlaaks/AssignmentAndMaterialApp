namespace TehtavaApp.API.Models;

public class NotificationMetadata
{
    public int Id { get; set; }
    public int NotificationId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int? CourseId { get; set; }
    public string CourseName { get; set; }
    public int? AssignmentId { get; set; }
    public string AssignmentTitle { get; set; }
    public int? MaterialId { get; set; }
    public string MaterialTitle { get; set; }
    public int? GroupId { get; set; }
    public string GroupName { get; set; }
    public decimal? Grade { get; set; }
    public DateTime? DueDate { get; set; }
    public string Url { get; set; }
    public string ImageUrl { get; set; }
    public List<NotificationAction> Actions { get; set; }

    // Navigation properties
    public virtual Notification Notification { get; set; }
    public virtual Course Course { get; set; }
    public virtual Assignment Assignment { get; set; }
    public virtual Material Material { get; set; }
    public virtual SchoolGroup Group { get; set; }
}

public class NotificationAction
{
    public int Id { get; set; }
    public int NotificationMetadataId { get; set; }
    public string Label { get; set; }
    public string Url { get; set; }
    public string Type { get; set; }

    // Navigation property
    public virtual NotificationMetadata NotificationMetadata { get; set; }
}
