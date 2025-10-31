using Microsoft.EntityFrameworkCore;
using System.Text;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.Extensions;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Services.Strategies;
using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Services;

public class AssignmentService : IAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AssignmentService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public AssignmentService(
        ApplicationDbContext context,
        INotificationService notificationService,
        ILogger<AssignmentService> logger,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
        _userManager = userManager;
    }

    public async Task<Assignment> CreateAssignmentAsync(Assignment assignment)
    {
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        // Get the course and its students
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == assignment.CourseId);

        if (course != null)
        {
            // Get all students enrolled in the course
            var students = await course.StudentsAsync(_context);
            
            // Create a notification strategy
            var notificationStrategy = new NewAssignmentStrategy(_context);
            
            // Create notifications for each student
            foreach (var student in students)
            {
                await notificationStrategy.CreateNotificationAsync(_notificationService, 
                    new { Assignment = assignment, StudentId = student.Id });
                
                // Send email notification if enabled
                var isEmailEnabled = await _notificationService.IsNotificationEnabledAsync(
                    student.Id,
                    NotificationType.Assignment,
                    NotificationChannel.Email);
                    
                if (isEmailEnabled)
                {
                    await _notificationService.SendNewAssignmentEmailAsync(assignment, student.Id);
                }
            }
        }

        return assignment;
    }

    public async Task<Assignment> GetAssignmentByIdAsync(int id)
    {
        return await _context.Assignments
            .Include(a => a.Course)
            .Include(a => a.CreatedBy)
            .Include(a => a.GradedBy)
            .Include(a => a.Submissions)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<Assignment>> GetCourseAssignmentsAsync(int courseId)
    {
        return await _context.Assignments
            .Where(a => a.CourseId == courseId)
            .Include(a => a.Course)
            .Include(a => a.CreatedBy)
            .Include(a => a.Submissions)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<Assignment> GetAssignmentWithSubmissionsAsync(int id)
    {
        return await _context.Assignments
            .Include(a => a.Course)
            .Include(a => a.CreatedBy)
            .Include(a => a.Submissions)
                .ThenInclude(s => s.Student)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<Assignment>> GetStudentAssignmentsAsync(string userId)
    {
        // Get the user's courses through group enrollments
        var courses = await _context.StudentGroupEnrollments
            .Where(sge => sge.StudentId == userId && sge.Status == EnrollmentStatus.Active)
            .Join(_context.SchoolGroups,
                  sge => sge.GroupId,
                  g => g.Id,
                  (sge, g) => g)
            .SelectMany(g => g.Courses)
            .Distinct()
            .ToListAsync();

        // Aggregate all assignments from these courses
        var assignments = new List<Assignment>();
        foreach (var course in courses)
        {
            var courseAssignments = await _context.Assignments
                .Where(a => a.CourseId == course.Id && a.IsActive)
                .Include(a => a.Course)
                .Include(a => a.Submissions.Where(s => s.StudentId == userId))
                .ToListAsync();
            
            // Update each assignment's status based on the student's submission
            foreach (var assignment in courseAssignments)
            {
                var submission = assignment.Submissions.FirstOrDefault();
                if (submission != null)
                {
                    // Set the assignment status based on the submission status
                    switch (submission.Status.ToLower())
                    {
                        case "submitted":
                            assignment.Status = AssignmentStatus.Submitted;
                            break;
                        case "graded":
                            assignment.Status = AssignmentStatus.Completed;
                            break;
                        case "returned":
                            assignment.Status = AssignmentStatus.Returned;
                            break;
                        default:
                            // Keep the original status if submission status doesn't match known values
                            break;
                    }
                }
                else if (DateTime.UtcNow > assignment.DueDate)
                {
                    // If there's no submission and the assignment is past due date, mark as overdue
                    // We use the Archived status since we don't have a dedicated Overdue status in the enum
                    assignment.Status = AssignmentStatus.Archived;
                }
            }
            
            assignments.AddRange(courseAssignments);
        }

        return assignments.OrderByDescending(a => a.DueDate);
    }

    public async Task<IEnumerable<Assignment>> GetDraftAssignmentsByCourseAsync(int courseId, string teacherId)
    {
        return await _context.Assignments
            .Where(a => a.CourseId == courseId && a.Status == AssignmentStatus.Draft && a.CreatedById == teacherId)
            .Include(a => a.Course)
            .Include(a => a.Submissions)
            .OrderByDescending(a => a.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Assignment>> GetTeacherPublishedAssignmentsByCourseAsync(int courseId, string teacherId)
    {
        return await _context.Assignments
            .Where(a => a.CourseId == courseId && a.Status == AssignmentStatus.Published && a.CreatedById == teacherId)
            .Include(a => a.Course)
            .Include(a => a.Submissions)
            .OrderByDescending(a => a.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Assignment>> GetRecentAssignmentsForUserAsync(string userId, int count = 5)
    {
        try
        {
            // First check if the user is a teacher
            var user = await _context.Users.FindAsync(userId);
            bool isTeacher = await _userManager.IsInRoleAsync(user, "Teacher");
            
            if (isTeacher)
            {
                // For teachers, get their latest created assignments
                return await _context.Assignments
                    .Where(a => a.CreatedById == userId)
                    .Include(a => a.Course)
                    .Include(a => a.Submissions)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(count)
                    .ToListAsync();
            }
            else
            {
                // For students, get the latest assignments from their courses
                var studentCourses = await _context.StudentGroupEnrollments
                    .Where(sge => sge.StudentId == userId && sge.Status == EnrollmentStatus.Active)
                    .Join(_context.SchoolGroups,
                          sge => sge.GroupId,
                          g => g.Id,
                          (sge, g) => g)
                    .SelectMany(g => g.Courses.Select(c => c.Id))
                    .Distinct()
                    .ToListAsync();
                
                return await _context.Assignments
                    .Where(a => studentCourses.Contains(a.CourseId) && a.Status == AssignmentStatus.Published && a.IsActive)
                    .Include(a => a.Course)
                    .Include(a => a.Submissions.Where(s => s.StudentId == userId))
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(count)
                    .ToListAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetRecentAssignmentsForUserAsync: {ex.Message}");
            return new List<Assignment>();
        }
    }

    public async Task<IEnumerable<Assignment>> GetAssignmentsAsync()
    {
        return await _context.Assignments
            .Include(a => a.Course)
            .Include(a => a.CreatedBy)
            .Include(a => a.Submissions)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<Assignment> UpdateAssignmentAsync(Assignment assignment)
    {
        var existingAssignment = await _context.Assignments
            .Include(a => a.Course)
            .FirstOrDefaultAsync(a => a.Id == assignment.Id);

        if (existingAssignment == null)
            return null;

        existingAssignment.Title = assignment.Title;
        existingAssignment.Description = assignment.Description;
        existingAssignment.DueDate = assignment.DueDate;
        existingAssignment.UpdatedAt = DateTime.UtcNow;
        existingAssignment.Status = assignment.Status;
        existingAssignment.RequiresRevision = assignment.RequiresRevision;

        await _context.SaveChangesAsync();

        var students = await existingAssignment.Course.StudentsAsync(_context);
        foreach (var student in students)
        {
            await _notificationService.CreateNotificationAsync(
                student.Id,
                "Assignment Updated",
                $"Assignment '{existingAssignment.Title}' has been updated",
                NotificationType.Assignment,
                existingAssignment.Id,
                existingAssignment.CourseId);
        }

        return existingAssignment;
    }

    public async Task DeleteAssignmentAsync(int id)
    {
        try 
        {
            // First, get the assignment with all related submissions
            var assignment = await _context.Assignments
                .Include(a => a.Submissions)
                .FirstOrDefaultAsync(a => a.Id == id);
                
            if (assignment != null)
            {
                // First, find notifications related to this assignment
                var notifications = await _context.Notifications
                    .Where(n => n.RelatedId == id && n.Type == NotificationType.Assignment)
                    .Include(n => n.Metadata)
                    .ToListAsync();
                
                if (notifications.Any())
                {
                    _logger.LogInformation($"Deleting {notifications.Count} notifications for assignment {id}");
                    
                    // The NotificationMetadata will be cascade deleted when we delete the notifications
                    _context.Notifications.RemoveRange(notifications);
                }
                
                // Remove all submissions (if any)
                if (assignment.Submissions != null && assignment.Submissions.Any())
                {
                    _context.AssignmentSubmissions.RemoveRange(assignment.Submissions);
                }
                
                // Then remove the assignment itself
                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Successfully deleted assignment {id} and its {assignment.Submissions?.Count ?? 0} submissions");
            }
            else
            {
                _logger.LogWarning($"Attempted to delete non-existent assignment with ID {id}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting assignment {id}: {ex.Message}");
            throw; // Re-throw to propagate to caller
        }
    }

    public async Task<bool> IsUserAuthorizedForAssignmentAsync(string userId, int assignmentId)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Course)
            .FirstOrDefaultAsync(a => a.Id == assignmentId);

        if (assignment == null)
            return false;

        // Check if user is admin (admins have access to all assignments)
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
            return true;

        if (assignment.CreatedById == userId || assignment.Course.TeacherId == userId)
            return true;

        return await assignment.Course.HasStudentAsync(userId, _context);
    }

    public async Task<AssignmentSubmission> SubmitAssignmentAsync(AssignmentSubmission submission)
    {
        try 
        {
            // Log the incoming submission data
            _logger.LogInformation($"Attempting to submit assignment. AssignmentId: {submission.AssignmentId}, StudentId: {submission.StudentId}");
            
            // Load the related Assignment entity to avoid FK constraint errors
            var assignment = await _context.Assignments
                .Include(a => a.Course)
                .Include(a => a.CreatedBy)
                .FirstOrDefaultAsync(a => a.Id == submission.AssignmentId);
                
            if (assignment == null)
            {
                var error = $"Assignment with ID {submission.AssignmentId} not found";
                _logger.LogError(error);
                throw new KeyNotFoundException(error);
            }
            _logger.LogInformation($"Found assignment: {assignment.Title} (ID: {assignment.Id})");

            // Load the Student entity
            var student = await _context.Users.FindAsync(submission.StudentId);
            if (student == null)
            {
                var error = $"Student with ID {submission.StudentId} not found";
                _logger.LogError(error);
                throw new KeyNotFoundException(error);
            }
            _logger.LogInformation($"Found student: {student.UserName} (ID: {student.Id})");

            // Set up the navigation properties
            submission.Assignment = assignment;
            submission.Student = student;
            submission.Status = "submitted";
            submission.SubmittedAt = DateTime.UtcNow;
            
            // Ensure FeedbackText is not null to satisfy database constraints
            submission.FeedbackText = submission.FeedbackText ?? string.Empty;
            
            _logger.LogInformation("Adding submission to database...");
            _context.AssignmentSubmissions.Add(submission);
            
            try {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Submission saved successfully with ID: {submission.Id}");
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Database error when saving submission");
                // Rethrow with more details
                throw new Exception($"Error saving submission to database: {ex.Message}", ex);
            }

            // Use the notification strategy to create notifications
            var notificationStrategy = new AssignmentSubmittedStrategy();
            
            // Create notification for student
            await notificationStrategy.CreateNotificationAsync(_notificationService, submission);
            
            // Create notification for teacher
            var teacherContext = new
            {
                IsTeacherNotification = true,
                AssignmentSubmission = submission
            };
            await notificationStrategy.CreateNotificationAsync(_notificationService, teacherContext);
            
            // Send email notification if enabled for student
            var isStudentEmailEnabled = await _notificationService.IsNotificationEnabledAsync(
                submission.StudentId,
                NotificationType.AssignmentSubmitted,
                NotificationChannel.Email);
                
            if (isStudentEmailEnabled)
            {
                await _notificationService.SendAssignmentSubmittedEmailAsync(submission);
            }

            return submission;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SubmitAssignmentAsync: {Message}, Inner exception: {InnerException}", 
                ex.Message, ex.InnerException?.Message);
            throw; // Re-throw to let the controller handle it
        }
    }

    public async Task<AssignmentSubmission> GradeSubmissionAsync(
        int submissionId,
        string grade,
        string feedback,
        string gradedById)
    {
        var submission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Course)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
            return null;

        double gradeValue = 0;
        if (double.TryParse(grade, out gradeValue))
        {
            submission.MarkAsGraded(gradedById, gradeValue, feedback);
            await _context.SaveChangesAsync();
        }
        else
        {
            // Handle invalid grade format
            _logger.LogWarning($"Invalid grade format: {grade}");
            submission.MarkAsGraded(gradedById, 0, feedback);
            await _context.SaveChangesAsync();
        }

        // Use the notification strategy to create the notification
        var notificationStrategy = new AssignmentGradedStrategy();
        await notificationStrategy.CreateNotificationAsync(_notificationService, submission);

        // Send email notification if enabled
        var isEmailEnabled = await _notificationService.IsNotificationEnabledAsync(
            submission.StudentId,
            NotificationType.AssignmentGraded,
            NotificationChannel.Email);

        if (isEmailEnabled)
        {
            await _notificationService.SendAssignmentGradedEmailAsync(submission);
        }

        return submission;
    }

    public async Task<AssignmentSubmission> ReturnSubmissionAsync(
        int submissionId,
        string feedback,
        string gradedById,
        bool requiresRevision = false)
    {
        var submission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Course)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
            return null;
            
        // Check if the gradedById exists in the AspNetUsers table
        var grader = await _context.Users.FindAsync(gradedById);
        if (grader == null)
        {
            _logger.LogError($"User with ID {gradedById} not found when trying to return submission {submissionId}");
            // Use null for GradedById if the user doesn't exist
            submission.FeedbackText = feedback;
            submission.GradedAt = DateTime.UtcNow;
            submission.RequiresRevision = requiresRevision;
            submission.Status = "returned";
        }
        else
        {
            // Use the MarkAsReturned method if the user exists
            submission.MarkAsReturned(gradedById, feedback, requiresRevision);
        }
        
        await _context.SaveChangesAsync();

        // Use the notification strategy to create the notification
        var notificationStrategy = new AssignmentReturnedStrategy();
        _logger.LogInformation($"Creating notification for returned assignment submission {submission.Id}");
        await notificationStrategy.CreateNotificationAsync(_notificationService, submission);

        // Also notify the teacher that the submission has been returned
        await _notificationService.CreateNotificationAsync(
            submission.Assignment.CreatedById,
            "Submission Returned",
            $"You have returned a submission for '{submission.Assignment.Title}' to {submission.Student?.FirstName} {submission.Student?.LastName}",
            NotificationType.Assignment,
            submission.Id,
            submission.Assignment.CourseId);

        // Send email notification if enabled
        var isEmailEnabled = await _notificationService.IsNotificationEnabledAsync(
            submission.StudentId,
            NotificationType.AssignmentReturned,
            NotificationChannel.Email);

        if (isEmailEnabled)
        {
            await _notificationService.SendAssignmentReturnedEmailAsync(submission);
        }

        return submission;
    }

    public async Task<IEnumerable<AssignmentSubmission>> GetStudentSubmissionsAsync(string studentId)
    {
        var submissions = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.SubmittedMaterials)
            .Where(s => s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
            
        // Populate the StudentName property from the Student entity
        foreach (var submission in submissions)
        {
            if (submission.Student != null)
            {
                submission.StudentName = submission.Student.FullName;
            }
        }
        
        return submissions;
    }

    public async Task<IEnumerable<AssignmentSubmission>> GetSubmissionsByAssignmentAsync(int assignmentId)
    {
        var submissions = await _context.AssignmentSubmissions
            .Include(s => s.Student)
            .Include(s => s.SubmittedMaterials)
            .Where(s => s.AssignmentId == assignmentId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
            
        // Populate the StudentName property from the Student entity
        foreach (var submission in submissions)
        {
            if (submission.Student != null)
            {
                submission.StudentName = submission.Student.FullName;
            }
        }
        
        return submissions;
    }

    public async Task<AssignmentSubmission> GetSubmissionByIdAsync(int id)
    {
        var submission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.GradedBy)
            .Include(s => s.SubmittedMaterials)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        // Populate the StudentName property
        if (submission != null && submission.Student != null)
        {
            submission.StudentName = submission.Student.FullName;
        }
        
        return submission;
    }

    public async Task<AssignmentSubmission> UpdateSubmissionAsync(AssignmentSubmission submission)
    {
        var existingSubmission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submission.Id);

        if (existingSubmission == null)
            return null;

        // Update the submission properties
        existingSubmission.SubmissionText = submission.SubmissionText;
        
        // If the submission was previously returned with revision required,
        // update its status back to Submitted
        if (existingSubmission.Status == "returned" && existingSubmission.RequiresRevision)
        {
            existingSubmission.Status = "submitted";
            existingSubmission.RequiresRevision = false;
            existingSubmission.SubmittedAt = DateTime.UtcNow;
            existingSubmission.AttemptNumber += 1;
        }

        await _context.SaveChangesAsync();

        // Notify the teacher about the updated submission
        if (existingSubmission.Assignment != null)
        {
            await _notificationService.CreateNotificationAsync(
                existingSubmission.Assignment.CreatedById,
                "Submission Updated",
                $"A submission for assignment '{existingSubmission.Assignment.Title}' has been updated",
                NotificationType.Assignment,
                existingSubmission.Id,
                existingSubmission.Assignment.CourseId);
        }

        return existingSubmission;
    }

    public async Task<object> GetPendingSubmissionsCountAsync(string courseId = null)
    {
        try
        {
            // Start with submissions that have "Submitted" status
            var query = _context.AssignmentSubmissions
                .Where(s => s.Status == "Submitted");

            // Filter by course if provided
            if (!string.IsNullOrEmpty(courseId) && int.TryParse(courseId, out int parsedCourseId))
            {
                query = query.Where(s => s.Assignment.CourseId == parsedCourseId);
            }

            // Count pending submissions
            int count = await query.CountAsync();
            
            return new { count };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending submissions count");
            return new { count = 0 };
        }
    }
}
