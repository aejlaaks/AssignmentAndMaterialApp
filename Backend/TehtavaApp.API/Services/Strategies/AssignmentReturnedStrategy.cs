using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services.Strategies
{
    /// <summary>
    /// Strategy for creating notifications when an assignment is returned to a student
    /// </summary>
    public class AssignmentReturnedStrategy : INotificationStrategy
    {
        private readonly ILogger<AssignmentReturnedStrategy> _logger;

        public AssignmentReturnedStrategy(ILogger<AssignmentReturnedStrategy> logger = null)
        {
            _logger = logger;
        }

        public async Task<Notification> CreateNotificationAsync(
            INotificationService notificationService, 
            object context)
        {
            var submission = (AssignmentSubmission)context;
            
            _logger?.LogInformation($"Creating assignment returned notification for student {submission.StudentId} for assignment {submission.AssignmentId}");
            
            var notificationTitle = submission.RequiresRevision 
                ? "Tehtävä palautettu korjattavaksi" 
                : "Tehtävä palautettu";
                
            var notificationMessage = $"Tehtävä '{submission.Assignment.Title}' on palautettu.";
            
            // Add feedback summary if available
            if (!string.IsNullOrEmpty(submission.FeedbackText))
            {
                var shortFeedback = submission.FeedbackText.Length > 100 
                    ? submission.FeedbackText.Substring(0, 97) + "..." 
                    : submission.FeedbackText;
                notificationMessage += $" Palaute: {shortFeedback}";
            }
            
            // Add revision note if required
            if (submission.RequiresRevision)
            {
                notificationMessage += " Tehtävä vaatii korjauksia.";
            }

            // Create metadata with action links
            var metadata = new NotificationMetadata
            {
                Url = $"/assignments/submission/{submission.Id}",
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                CourseId = submission.Assignment.CourseId,
                CourseName = submission.Assignment.Course?.Name ?? "Tuntematon kurssi",
                Description = submission.RequiresRevision 
                    ? $"Tehtävä '{submission.Assignment.Title}' on palautettu korjattavaksi" 
                    : $"Tehtävä '{submission.Assignment.Title}' on palautettu",
                GroupName = "Ei ryhmää",
                MaterialTitle = "Ei materiaalia",
                ImageUrl = "/images/default-notification.png",
                Title = notificationTitle,
                Actions = new List<NotificationAction>
                {
                    new NotificationAction
                    {
                        Label = "Näytä palaute",
                        Url = $"/assignments/submission/{submission.Id}",
                        Type = "link"
                    }
                }
            };

            _logger?.LogInformation($"Sending notification to student {submission.StudentId} with title: {notificationTitle}");

            // Create and return the notification
            var notification = await notificationService.CreateNotificationAsync(
                submission.StudentId,
                notificationTitle,
                notificationMessage,
                NotificationType.AssignmentReturned,
                submission.Id,
                submission.Assignment.CourseId,
                null, // No group
                metadata);
                
            _logger?.LogInformation($"Notification created with ID: {notification.Id}");
            
            return notification;
        }
    }
} 