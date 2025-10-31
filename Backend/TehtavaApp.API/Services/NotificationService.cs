using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using System.Threading.Tasks;
using System.Text;

namespace TehtavaApp.API.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;
    private readonly IConfiguration _configuration;

    public NotificationService(
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<Notification> CreateNotificationAsync(Notification notification)
    {
        notification.CreatedAt = DateTime.UtcNow;
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Load related entities for DTO conversion
        await _context.Entry(notification)
            .Reference(n => n.Course)
            .LoadAsync();
        await _context.Entry(notification)
            .Reference(n => n.Group)
            .LoadAsync();
        await _context.Entry(notification)
            .Reference(n => n.Metadata)
            .LoadAsync();

        var notificationDto = notification.ToDTO();

        // Send real-time notification
        await _hubContext.Clients.Group($"User_{notification.UserId}")
            .SendAsync("ReceiveNotification", notificationDto);

        // Update unread count
        var unreadCount = await GetUnreadCountAsync(notification.UserId);
        await _hubContext.Clients.Group($"User_{notification.UserId}")
            .SendAsync("NotificationCountUpdated", new NotificationCountDTO { UnreadCount = unreadCount });

        return notification;
    }

    public async Task<Notification> CreateNotificationAsync(
        string userId,
        string title,
        string message,
        NotificationType type,
        int? relatedId = null,
        int? courseId = null,
        int? groupId = null,
        NotificationMetadata metadata = null)
    {
        // Ensure metadata has a GroupName to prevent NULL value errors
        if (metadata != null && string.IsNullOrEmpty(metadata.GroupName))
        {
            metadata.GroupName = "Default";
        }
        
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedId = relatedId,
            CourseId = courseId,
            GroupId = groupId,
            Metadata = metadata,
            CreatedAt = DateTime.UtcNow
        };

        return await CreateNotificationAsync(notification);
    }

    public async Task<PaginatedList<Notification>> GetUserNotificationsAsync(
        string userId,
        bool unreadOnly = false,
        int page = 1,
        int pageSize = 10,
        string sortBy = "createdAt",
        bool sortDescending = true)
    {
        var query = _context.Notifications
            .Include(n => n.Metadata)
            .Include(n => n.Course)
            .Include(n => n.Group)
            .Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        // Handle sorting
        query = sortBy.ToLower() switch
        {
            "createdat" => sortDescending 
                ? query.OrderByDescending(n => n.CreatedAt)
                : query.OrderBy(n => n.CreatedAt),
            "title" => sortDescending 
                ? query.OrderByDescending(n => n.Title)
                : query.OrderBy(n => n.Title),
            "type" => sortDescending 
                ? query.OrderByDescending(n => n.Type)
                : query.OrderBy(n => n.Type),
            "isread" => sortDescending 
                ? query.OrderByDescending(n => n.IsRead)
                : query.OrderBy(n => n.IsRead),
            _ => sortDescending 
                ? query.OrderByDescending(n => n.CreatedAt)
                : query.OrderBy(n => n.CreatedAt)
        };

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply pagination
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedList<Notification>(items, totalCount, page, pageSize);
    }

    public async Task<Notification> GetNotificationByIdAsync(int id)
    {
        return await _context.Notifications
            .Include(n => n.Metadata)
            .Include(n => n.Course)
            .Include(n => n.Group)
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
            return false;

        notification.MarkAsRead();
        await _context.SaveChangesAsync();

        // Send real-time update
        await _hubContext.Clients.Group($"User_{notification.UserId}")
            .SendAsync("NotificationRead", id);

        // Update unread count
        var unreadCount = await GetUnreadCountAsync(notification.UserId);
        await _hubContext.Clients.Group($"User_{notification.UserId}")
            .SendAsync("NotificationCountUpdated", new NotificationCountDTO { UnreadCount = unreadCount });

        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.MarkAsRead();
        }

        await _context.SaveChangesAsync();

        // Send real-time update
        await _hubContext.Clients.Group($"User_{userId}")
            .SendAsync("AllNotificationsRead");

        // Update unread count
        await _hubContext.Clients.Group($"User_{userId}")
            .SendAsync("NotificationCountUpdated", new NotificationCountDTO { UnreadCount = 0 });

        return true;
    }

    public async Task<bool> DeleteNotificationAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
            return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        // Update unread count if the notification was unread
        if (!notification.IsRead)
        {
            var unreadCount = await GetUnreadCountAsync(notification.UserId);
            await _hubContext.Clients.Group($"User_{notification.UserId}")
                .SendAsync("NotificationCountUpdated", new NotificationCountDTO { UnreadCount = unreadCount });
        }

        return true;
    }

    public async Task<bool> DeleteAllNotificationsAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync();

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();

        // Update unread count
        await _hubContext.Clients.Group($"User_{userId}")
            .SendAsync("NotificationCountUpdated", new NotificationCountDTO { UnreadCount = 0 });

        return true;
    }

    public async Task<NotificationPreference> GetUserPreferencesAsync(string userId, NotificationType type)
    {
        return await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Type == type);
    }

    public async Task<IEnumerable<NotificationPreference>> GetAllUserPreferencesAsync(string userId)
    {
        return await _context.NotificationPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync();
    }

    public async Task<NotificationPreference> UpdateUserPreferencesAsync(
        string userId,
        NotificationType type,
        NotificationChannel channel,
        bool isEnabled)
    {
        var preference = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Type == type && p.Channel == channel);

        if (preference == null)
        {
            preference = new NotificationPreference
            {
                UserId = userId,
                Type = type,
                Channel = channel,
                IsEnabled = isEnabled,
                CreatedAt = DateTime.UtcNow
            };
            _context.NotificationPreferences.Add(preference);
        }
        else
        {
            preference.IsEnabled = isEnabled;
            preference.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Send real-time update
        await _hubContext.Clients.Group($"User_{userId}")
            .SendAsync("NotificationPreferenceUpdated", preference.ToDTO());

        return preference;
    }

    public async Task<bool> IsNotificationEnabledAsync(
        string userId,
        NotificationType type,
        NotificationChannel channel)
    {
        var preference = await GetUserPreferencesAsync(userId, type);
        return preference?.IsEnabled ?? true;
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> SendEmailNotificationAsync(string userId, string subject, string body)
    {
        try
        {
            // Get the user's email address
            var user = await _context.Users.FindAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.Email))
            {
                _logger.LogWarning($"Cannot send email notification: User {userId} not found or has no email");
                return false;
            }

            return await SendEmailDirectAsync(user.Email, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending email notification to user {userId}: {ex.Message}");
            return false;
        }
    }
    
    public async Task<bool> SendEmailDirectAsync(string email, string subject, string body)
    {
        try
        {
            // Get email settings from configuration
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var smtpUsername = emailSettings["SmtpUsername"];
            var smtpPassword = emailSettings["SmtpPassword"];
            var senderEmail = emailSettings["SenderEmail"];
            var senderName = emailSettings["SenderName"];

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUsername) || 
                string.IsNullOrEmpty(smtpPassword) || string.IsNullOrEmpty(senderEmail))
            {
                _logger.LogWarning("Email settings are incomplete. Cannot send email notification.");
                return false;
            }

            // Create the email message
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = subject;

            // Create the HTML body part
            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = body,
                TextBody = StripHtml(body) // Plain text fallback
            };

            message.Body = bodyBuilder.ToMessageBody();

            // Send the email
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, false);
            await client.AuthenticateAsync(smtpUsername, smtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"Email notification sent to {email} with subject: {subject}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending email notification to {email}: {ex.Message}");
            return false;
        }
    }
    
    private string StripHtml(string html)
    {
        // Simple HTML stripping for plain text emails
        if (string.IsNullOrEmpty(html))
            return string.Empty;
            
        var text = html
            .Replace("<br>", "\n")
            .Replace("<br/>", "\n")
            .Replace("<br />", "\n")
            .Replace("<p>", "\n")
            .Replace("</p>", "\n");
            
        // Remove all other HTML tags
        var result = System.Text.RegularExpressions.Regex.Replace(text, "<[^>]*>", string.Empty);
        return result;
    }
    
    public async Task<bool> SendAssignmentReturnedEmailAsync(AssignmentSubmission submission)
    {
        var student = await _context.Users.FindAsync(submission.StudentId);
        if (student == null || string.IsNullOrEmpty(student.Email))
            return false;

        var subject = submission.RequiresRevision 
            ? $"Tehtävä palautettu korjattavaksi: {submission.Assignment.Title}" 
            : $"Tehtävä palautettu: {submission.Assignment.Title}";
            
        var body = new StringBuilder();
        body.AppendLine($"<h2>Tehtävä: {submission.Assignment.Title}</h2>");
        body.AppendLine($"<p>Kurssi: {submission.Assignment.Course?.Name ?? "Tuntematon kurssi"}</p>");
        
        if (submission.RequiresRevision)
        {
            body.AppendLine("<p><strong>Tämä tehtävä vaatii korjauksia.</strong></p>");
        }
        
        body.AppendLine("<h3>Palaute:</h3>");
        body.AppendLine($"<div>{submission.FeedbackText}</div>");
        
        body.AppendLine("<p>Voit tarkastella palautetta kokonaisuudessaan kirjautumalla järjestelmään.</p>");
        body.AppendLine($"<p><a href=\"{_configuration["ApplicationUrl"]}/assignments/submission/{submission.Id}\">Näytä palaute</a></p>");
        
        return await SendEmailDirectAsync(student.Email, subject, body.ToString());
    }
    
    public async Task<bool> SendAssignmentGradedEmailAsync(AssignmentSubmission submission)
    {
        var student = await _context.Users.FindAsync(submission.StudentId);
        if (student == null || string.IsNullOrEmpty(student.Email))
            return false;

        var subject = $"Tehtävä arvioitu: {submission.Assignment.Title}";
            
        var body = new StringBuilder();
        body.AppendLine($"<h2>Tehtävä: {submission.Assignment.Title}</h2>");
        body.AppendLine($"<p>Kurssi: {submission.Assignment.Course?.Name ?? "Tuntematon kurssi"}</p>");
        
        if (submission.Grade.HasValue)
        {
            body.AppendLine($"<p><strong>Arvosana: {submission.Grade.Value}</strong></p>");
        }
        
        body.AppendLine("<h3>Palaute:</h3>");
        body.AppendLine($"<div>{submission.FeedbackText}</div>");
        
        body.AppendLine("<p>Voit tarkastella arviointia kokonaisuudessaan kirjautumalla järjestelmään.</p>");
        body.AppendLine($"<p><a href=\"{_configuration["ApplicationUrl"]}/assignments/submission/{submission.Id}\">Näytä arviointi</a></p>");
        
        return await SendEmailDirectAsync(student.Email, subject, body.ToString());
    }
    
    public async Task<bool> SendNewAssignmentEmailAsync(Assignment assignment, string studentId)
    {
        var student = await _context.Users.FindAsync(studentId);
        if (student == null || string.IsNullOrEmpty(student.Email))
            return false;

        var subject = $"Uusi tehtävä: {assignment.Title}";
            
        var body = new StringBuilder();
        body.AppendLine($"<h2>Uusi tehtävä: {assignment.Title}</h2>");
        body.AppendLine($"<p>Kurssi: {assignment.Course?.Name ?? "Tuntematon kurssi"}</p>");
        body.AppendLine($"<p><strong>Palautuspäivä: {assignment.DueDate.ToShortDateString()}</strong></p>");
        
        if (!string.IsNullOrEmpty(assignment.Description))
        {
            body.AppendLine("<h3>Kuvaus:</h3>");
            body.AppendLine($"<div>{assignment.Description}</div>");
        }
        
        body.AppendLine("<p>Voit tarkastella tehtävää kokonaisuudessaan kirjautumalla järjestelmään.</p>");
        body.AppendLine($"<p><a href=\"{_configuration["ApplicationUrl"]}/courses/{assignment.CourseId}/assignments/{assignment.Id}\">Näytä tehtävä</a></p>");
        
        return await SendEmailDirectAsync(student.Email, subject, body.ToString());
    }

    public async Task<bool> SendAssignmentSubmittedEmailAsync(AssignmentSubmission submission)
    {
        // Send email to student confirming submission
        var student = await _context.Users.FindAsync(submission.StudentId);
        if (student == null || string.IsNullOrEmpty(student.Email))
            return false;

        var subject = $"Tehtävä palautettu: {submission.Assignment.Title}";
            
        var body = new StringBuilder();
        body.AppendLine($"<h2>Tehtävä palautettu: {submission.Assignment.Title}</h2>");
        body.AppendLine($"<p>Kurssi: {submission.Assignment.Course?.Name ?? "Tuntematon kurssi"}</p>");
        body.AppendLine($"<p><strong>Palautettu: {submission.SubmittedAt.ToLocalTime():g}</strong></p>");
        
        if (!string.IsNullOrEmpty(submission.SubmissionText))
        {
            body.AppendLine("<h3>Palautusteksti:</h3>");
            body.AppendLine($"<div>{submission.SubmissionText}</div>");
        }
        
        body.AppendLine("<p>Saat ilmoituksen, kun opettaja on arvioinut tehtävän.</p>");
        body.AppendLine("<p>Voit tarkastella palautustasi kokonaisuudessaan kirjautumalla järjestelmään.</p>");
        body.AppendLine($"<p><a href=\"{_configuration["ApplicationUrl"]}/assignments/submission/{submission.Id}\">Näytä palautus</a></p>");
        
        // Also send notification to teacher
        var teacherEmailSent = false;
        if (submission.Assignment.CreatedBy != null && !string.IsNullOrEmpty(submission.Assignment.CreatedBy.Email))
        {
            var teacherSubject = $"Uusi palautus: {submission.Assignment.Title}";
            var teacherBody = new StringBuilder();
            teacherBody.AppendLine($"<h2>Uusi palautus: {submission.Assignment.Title}</h2>");
            teacherBody.AppendLine($"<p>Kurssi: {submission.Assignment.Course?.Name ?? "Tuntematon kurssi"}</p>");
            teacherBody.AppendLine($"<p>Opiskelija: {student.FirstName} {student.LastName}</p>");
            teacherBody.AppendLine($"<p><strong>Palautettu: {submission.SubmittedAt.ToLocalTime():g}</strong></p>");
            
            teacherBody.AppendLine("<p>Voit tarkastella palautusta ja antaa arvioinnin kirjautumalla järjestelmään.</p>");
            teacherBody.AppendLine($"<p><a href=\"{_configuration["ApplicationUrl"]}/assignments/submission/{submission.Id}\">Tarkastele palautusta</a></p>");
            
            teacherEmailSent = await SendEmailDirectAsync(submission.Assignment.CreatedBy.Email, teacherSubject, teacherBody.ToString());
        }
        
        // Return true if at least student email was sent successfully
        return await SendEmailDirectAsync(student.Email, subject, body.ToString());
    }

    public async Task<bool> SendPushNotificationAsync(string userId, string title, string message)
    {
        try
        {
            // Get the user's push notification token
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning($"Cannot send push notification: User {userId} not found");
                return false;
            }

            // Check if the user has any push notification tokens
            var pushToken = await _context.PushNotificationTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.IsActive);

            if (pushToken == null)
            {
                _logger.LogWarning($"User {userId} has no active push notification tokens");
                return false;
            }

            // NOTE: In a real implementation, we would use Firebase Cloud Messaging
            // or another push notification service to send the notification.
            // For now, we'll just log the notification and return true.
            _logger.LogInformation($"PUSH NOTIFICATION to {userId}: Title: {title}, Message: {message}");

            // For a complete implementation, uncomment and implement the following:
            /*
            var pushSettings = _configuration.GetSection("PushNotificationSettings");
            var fcmApiKey = pushSettings["FcmApiKey"];

            // Create the FCM notification payload
            var payload = new
            {
                to = pushToken.Token,
                notification = new
                {
                    title,
                    body = message,
                    icon = "ic_notification"
                }
            };

            // Send the notification to FCM
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("key", $"={fcmApiKey}");
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await httpClient.PostAsync(
                "https://fcm.googleapis.com/fcm/send",
                new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            );

            return response.IsSuccessStatusCode;
            */

            // Simulate successful push notification
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending push notification to user {userId}: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> SendCourseNotificationAsync(
        int courseId,
        string title,
        string message,
        NotificationType type,
        NotificationPriority priority = NotificationPriority.Medium)
    {
        try
        {
            // Hae kurssin ryhmät ja niiden opiskelijat
            var groups = await _context.SchoolGroups
                .Where(g => g.Courses.Any(c => c.Id == courseId))
                .ToListAsync();

            if (!groups.Any())
            {
                // Jos kurssilla ei ole ryhmiä, ei voida lähettää ilmoituksia
                return false;
            }

            var studentIds = new HashSet<string>();
            
            // Kerää kaikki opiskelijat kurssin ryhmistä
            foreach (var group in groups)
            {
                var groupStudentIds = await _context.StudentGroupEnrollments
                    .Where(sge => sge.GroupId == group.Id)
                    .Select(sge => sge.StudentId)
                    .ToListAsync();
                
                foreach (var studentId in groupStudentIds)
                {
                    studentIds.Add(studentId);
                }
            }

            if (!studentIds.Any())
            {
                // Jos kurssilla ei ole opiskelijoita, ei voida lähettää ilmoituksia
                return false;
            }

            var course = await _context.Courses.FindAsync(courseId);
            if (course == null)
            {
                return false;
            }

            // Luo ilmoitus jokaiselle opiskelijalle
            foreach (var studentId in studentIds)
            {
                var notification = new Notification
                {
                    UserId = studentId,
                    Title = title,
                    Message = message,
                    Type = type,
                    Priority = priority,
                    CourseId = courseId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await CreateNotificationAsync(notification);
            }

            // Lähetä ilmoitus myös SignalR:n kautta kurssiryhmälle
            var notificationDto = new NotificationDTO
            {
                Title = title,
                Message = message,
                Type = type.ToString(),
                Priority = priority.ToString(),
                CourseId = courseId,
                CreatedAt = DateTime.UtcNow.ToString("o")
            };

            await _hubContext.Clients.Group($"course-{courseId}")
                .SendAsync("ReceiveCourseNotification", notificationDto);

            return true;
        }
        catch (Exception ex)
        {
            // Log the exception
            Console.WriteLine($"Error sending course notification: {ex.Message}");
            return false;
        }
    }
}
