using System.Collections.Generic;
using System.Threading.Tasks;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services.Strategies
{
    /// <summary>
    /// Strategy for creating notifications when an assignment is graded
    /// </summary>
    public class AssignmentGradedStrategy : INotificationStrategy
    {
        public async Task<Notification> CreateNotificationAsync(
            INotificationService notificationService, 
            object context)
        {
            var submission = (AssignmentSubmission)context;
            
            var notificationTitle = "Tehtävä arvioitu";
            var notificationMessage = $"Tehtävä '{submission.Assignment.Title}' on arvioitu";
            
            if (submission.Grade.HasValue)
            {
                notificationMessage += $" arvosanalla {submission.Grade.Value}";
            }
            
            if (!string.IsNullOrEmpty(submission.FeedbackText))
            {
                var shortFeedback = submission.FeedbackText.Length > 100 
                    ? submission.FeedbackText.Substring(0, 97) + "..." 
                    : submission.FeedbackText;
                notificationMessage += $". Palaute: {shortFeedback}";
            }
            
            // Create metadata with action links
            var metadata = new NotificationMetadata
            {
                Title = notificationTitle,
                Description = notificationMessage,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                CourseId = submission.Assignment.CourseId,
                CourseName = submission.Assignment.Course?.Name,
                Grade = submission.Grade.HasValue ? (decimal?)submission.Grade.Value : null,
                GroupName = "Default", // Add default GroupName to prevent NULL value errors
                ImageUrl = "/assets/icons/assignment-graded.png", // Default image URL to prevent NULL value errors
                Url = $"/submissions/{submission.Id}", // Add default URL
                MaterialTitle = "Ei materiaalia", // Default material title to prevent NULL value errors
                Actions = new List<NotificationAction>()
            };

            // Add action to view the submission
            metadata.Actions.Add(new NotificationAction
            {
                Label = "Näytä arviointi",
                Url = $"/assignments/submission/{submission.Id}",
                Type = "view"
            });

            // Create and return the notification
            return await notificationService.CreateNotificationAsync(
                submission.StudentId,
                notificationTitle,
                notificationMessage,
                NotificationType.AssignmentGraded,
                submission.Id,
                submission.Assignment.CourseId,
                null, // No group
                metadata);
        }
    }
} 