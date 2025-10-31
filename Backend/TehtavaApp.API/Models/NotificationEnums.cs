namespace TehtavaApp.API.Models;

public enum NotificationType
{
    System = 0,
    Assignment = 1,
    Course = 2,
    Group = 3,
    User = 4,
    Grade = 5,
    Submission = 6,
    Comment = 7,
    Material = 8,
    Announcement = 9,
    Reminder = 10,
    GroupUpdate = 11,
    GroupEnrollment = 12,
    MaterialUpdate = 13,
    AssignmentGraded = 14,
    AccountDeactivation = 15,
    AccountActivation = 16,
    AssignmentSubmitted = 17,
    AssignmentReturned = 18,
    Other = 99
}

public enum NotificationChannel
{
    InApp = 0,
    Email = 1,
    Push = 2,
    SMS = 3
}

public enum NotificationPriority
{
    Low = 0,
    Medium = 1,
    High = 2
}
