using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Data;
using TehtavaApp.API.Extensions;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services;

/// <summary>
/// Implementation of IMaterialNotificationService.
/// Follows the Single Responsibility Principle by focusing only on material-related notifications.
/// Follows the Dependency Inversion Principle by depending on INotificationService abstraction.
/// Decouples notification logic from material CRUD operations.
/// </summary>
public class MaterialNotificationService : IMaterialNotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<MaterialNotificationService> _logger;

    public MaterialNotificationService(
        ApplicationDbContext context,
        INotificationService notificationService,
        ILogger<MaterialNotificationService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task NotifyMaterialCreatedAsync(Material material)
    {
        try
        {
            _logger.LogInformation($"Sending notifications for new material: {material.Title}");

            if (!material.CourseId.HasValue)
            {
                _logger.LogInformation("Material is not associated with a course, skipping notifications");
                return;
            }

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == material.CourseId.Value);

            if (course == null)
            {
                _logger.LogWarning($"Course {material.CourseId} not found for material {material.Id}");
                return;
            }

            // Get all students enrolled in the course
            var students = await course.StudentsAsync(_context);
            var studentCount = students.Count();

            _logger.LogInformation($"Notifying {studentCount} students about new material '{material.Title}' in course '{course.Name}'");

            foreach (var student in students)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(new Notification
                    {
                        UserId = student.Id,
                        Title = "New Course Material",
                        Message = $"New material '{material.Title}' has been added to {course.Name}",
                        Type = NotificationType.Material,
                        RelatedId = material.Id
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending notification to student {student.Id}");
                }
            }

            _logger.LogInformation($"Successfully sent {studentCount} notifications for material '{material.Title}'");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error notifying material created for material {material.Id}");
        }
    }

    public async Task NotifyMaterialUpdatedAsync(Material material)
    {
        try
        {
            _logger.LogInformation($"Sending notifications for updated material: {material.Title}");

            if (!material.CourseId.HasValue)
            {
                _logger.LogInformation("Material is not associated with a course, skipping notifications");
                return;
            }

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == material.CourseId.Value);

            if (course == null)
            {
                _logger.LogWarning($"Course {material.CourseId} not found for material {material.Id}");
                return;
            }

            // Get all students enrolled in the course
            var students = await course.StudentsAsync(_context);
            var studentCount = students.Count();

            _logger.LogInformation($"Notifying {studentCount} students about updated material '{material.Title}' in course '{course.Name}'");

            foreach (var student in students)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(new Notification
                    {
                        UserId = student.Id,
                        Title = "Material Updated",
                        Message = $"Material '{material.Title}' in {course.Name} has been updated",
                        Type = NotificationType.Material,
                        RelatedId = material.Id
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending notification to student {student.Id}");
                }
            }

            _logger.LogInformation($"Successfully sent {studentCount} notifications for updated material '{material.Title}'");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error notifying material updated for material {material.Id}");
        }
    }

    public async Task NotifyMaterialDeletedAsync(int materialId, string materialTitle, int? courseId = null)
    {
        try
        {
            _logger.LogInformation($"Sending notifications for deleted material: {materialTitle}");

            if (!courseId.HasValue)
            {
                _logger.LogInformation("Material was not associated with a course, skipping notifications");
                return;
            }

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId.Value);

            if (course == null)
            {
                _logger.LogWarning($"Course {courseId} not found for deleted material {materialId}");
                return;
            }

            // Get all students enrolled in the course
            var students = await course.StudentsAsync(_context);
            var studentCount = students.Count();

            _logger.LogInformation($"Notifying {studentCount} students about deleted material '{materialTitle}' in course '{course.Name}'");

            foreach (var student in students)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(new Notification
                    {
                        UserId = student.Id,
                        Title = "Material Removed",
                        Message = $"Material '{materialTitle}' has been removed from {course.Name}",
                        Type = NotificationType.Material,
                        RelatedId = materialId
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending notification to student {student.Id}");
                }
            }

            _logger.LogInformation($"Successfully sent {studentCount} notifications for deleted material '{materialTitle}'");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error notifying material deleted for material {materialId}");
        }
    }

    public async Task NotifyBulkMaterialsUploadedAsync(IEnumerable<Material> materials, int courseId)
    {
        try
        {
            var materialsList = materials.ToList();
            var materialCount = materialsList.Count;

            _logger.LogInformation($"Sending notifications for {materialCount} bulk uploaded materials to course {courseId}");

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
            {
                _logger.LogWarning($"Course {courseId} not found for bulk upload");
                return;
            }

            // Get all students enrolled in the course
            var students = await course.StudentsAsync(_context);
            var studentCount = students.Count();

            _logger.LogInformation($"Notifying {studentCount} students about {materialCount} new materials in course '{course.Name}'");

            foreach (var student in students)
            {
                try
                {
                    var message = materialCount == 1
                        ? $"New material '{materialsList.First().Title}' has been added to {course.Name}"
                        : $"{materialCount} new materials have been added to {course.Name}";

                    await _notificationService.CreateNotificationAsync(new Notification
                    {
                        UserId = student.Id,
                        Title = "New Course Materials",
                        Message = message,
                        Type = NotificationType.Material,
                        RelatedId = courseId
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error sending notification to student {student.Id}");
                }
            }

            _logger.LogInformation($"Successfully sent {studentCount} notifications for bulk upload");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error notifying bulk materials uploaded for course {courseId}");
        }
    }
}

