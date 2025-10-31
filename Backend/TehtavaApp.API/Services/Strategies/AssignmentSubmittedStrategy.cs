using System.Collections.Generic;
using System.Threading.Tasks;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services.Strategies
{
    /// <summary>
    /// Strategy for creating notifications when an assignment is submitted
    /// </summary>
    public class AssignmentSubmittedStrategy : INotificationStrategy
    {
        public async Task<Notification> CreateNotificationAsync(
            INotificationService notificationService, 
            object context)
        {
            AssignmentSubmission submission;
            bool isTeacherNotification = false;
            
            // Check if this is a teacher notification
            if (context.GetType().GetProperty("IsTeacherNotification") != null)
            {
                // Use reflection to safely access dynamic properties
                var isTeacherNotificationProp = context.GetType().GetProperty("IsTeacherNotification");
                isTeacherNotification = (bool)isTeacherNotificationProp.GetValue(context, null);
                
                if (isTeacherNotification)
                {
                    var submissionProp = context.GetType().GetProperty("AssignmentSubmission");
                    submission = (AssignmentSubmission)submissionProp.GetValue(context, null);
                }
                else
                {
                    submission = (AssignmentSubmission)context;
                }
            }
            else
            {
                submission = (AssignmentSubmission)context;
            }
            
            if (isTeacherNotification)
            {
                // Notification for teacher
                return await CreateTeacherNotificationAsync(notificationService, submission);
            }
            else
            {
                // Notification for student
                return await CreateStudentNotificationAsync(notificationService, submission);
            }
        }
        
        private async Task<Notification> CreateTeacherNotificationAsync(
            INotificationService notificationService,
            AssignmentSubmission submission)
        {
            var metadata = new NotificationMetadata
            {
                Url = $"/assignments/submission/{submission.Id}",
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                CourseId = submission.Assignment.CourseId,
                CourseName = submission.Assignment.Course?.Name ?? "Tuntematon kurssi",
                Description = $"Opiskelija {submission.Student?.FirstName} {submission.Student?.LastName} on palauttanut tehtävän '{submission.Assignment.Title}'",
                GroupName = "Ei ryhmää",
                MaterialTitle = "Ei materiaalia",
                ImageUrl = "/images/submission-icon.png",
                Title = "Uusi palautus",
                Actions = new List<NotificationAction>
                {
                    new NotificationAction
                    {
                        Label = "Tarkastele palautusta",
                        Url = $"/assignments/submission/{submission.Id}",
                        Type = "link"
                    }
                }
            };
            
            return await notificationService.CreateNotificationAsync(
                submission.Assignment.CreatedById,
                "Uusi palautus",
                $"Opiskelija {submission.Student?.FirstName} {submission.Student?.LastName} on palauttanut tehtävän '{submission.Assignment.Title}'",
                NotificationType.AssignmentSubmitted,
                submission.Id,
                submission.Assignment.CourseId,
                null,
                metadata);
        }
        
        private async Task<Notification> CreateStudentNotificationAsync(
            INotificationService notificationService,
            AssignmentSubmission submission)
        {
            var metadata = new NotificationMetadata
            {
                Url = $"/assignments/submission/{submission.Id}",
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                CourseId = submission.Assignment.CourseId,
                CourseName = submission.Assignment.Course?.Name ?? "Tuntematon kurssi",
                Description = $"Tehtävä '{submission.Assignment.Title}' on palautettu onnistuneesti",
                GroupName = "Ei ryhmää",
                MaterialTitle = "Ei materiaalia",
                ImageUrl = "/images/default-notification.png",
                Title = "Tehtävä palautettu",
                Actions = new List<NotificationAction>
                {
                    new NotificationAction
                    {
                        Label = "Näytä palautus",
                        Url = $"/assignments/submission/{submission.Id}",
                        Type = "link"
                    }
                }
            };
            
            return await notificationService.CreateNotificationAsync(
                submission.StudentId,
                "Tehtävä palautettu",
                $"Tehtävä '{submission.Assignment.Title}' on palautettu onnistuneesti. Saat ilmoituksen, kun opettaja on arvioinut tehtävän.",
                NotificationType.AssignmentSubmitted,
                submission.Id,
                submission.Assignment.CourseId,
                null,
                metadata);
        }
    }
} 