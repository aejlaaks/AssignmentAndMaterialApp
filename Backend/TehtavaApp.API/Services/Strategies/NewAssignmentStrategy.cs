using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services.Strategies
{
    /// <summary>
    /// Strategy for creating notifications when a new assignment is created
    /// </summary>
    public class NewAssignmentStrategy : INotificationStrategy
    {
        private readonly ApplicationDbContext _context;

        public NewAssignmentStrategy(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Notification> CreateNotificationAsync(
            INotificationService notificationService, 
            object context)
        {
            Assignment assignment;
            string studentId;
            
            // Check if context is a dynamic object with Assignment and StudentId properties
            if (context.GetType().GetProperty("Assignment") != null && 
                context.GetType().GetProperty("StudentId") != null)
            {
                // Use reflection to safely access properties
                var assignmentProp = context.GetType().GetProperty("Assignment");
                assignment = (Assignment)assignmentProp.GetValue(context, null);
                
                var studentIdProp = context.GetType().GetProperty("StudentId");
                studentId = (string)studentIdProp.GetValue(context, null);
            }
            else
            {
                // Fallback to old format
                assignment = (Assignment)context;
                studentId = (string)((dynamic)context).StudentId;
            }
            
            // Create metadata with action links
            var metadata = new NotificationMetadata
            {
                Url = $"/courses/{assignment.CourseId}/assignments/{assignment.Id}",
                AssignmentId = assignment.Id,
                AssignmentTitle = assignment.Title,
                CourseId = assignment.CourseId,
                CourseName = assignment.Course?.Name ?? "Tuntematon kurssi",
                Description = $"Uusi tehtävä '{assignment.Title}' on lisätty kurssille '{assignment.Course?.Name ?? "Tuntematon kurssi"}'",
                GroupName = "Ei ryhmää",
                MaterialTitle = "Ei materiaalia",
                ImageUrl = "/images/assignment-icon.png",
                Title = "Uusi tehtävä",
                Actions = new List<NotificationAction>
                {
                    new NotificationAction
                    {
                        Label = "Näytä tehtävä",
                        Url = $"/courses/{assignment.CourseId}/assignments/{assignment.Id}",
                        Type = "link"
                    }
                }
            };

            // Create and return the notification
            return await notificationService.CreateNotificationAsync(
                studentId,
                "Uusi tehtävä",
                $"Uusi tehtävä '{assignment.Title}' on lisätty kurssille '{assignment.Course?.Name ?? "Tuntematon kurssi"}'. Palautuspäivä: {assignment.DueDate.ToShortDateString()}",
                NotificationType.Assignment,
                assignment.Id,
                assignment.CourseId,
                null, // No group
                metadata);
        }
    }
} 