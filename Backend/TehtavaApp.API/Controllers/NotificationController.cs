using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;

namespace TehtavaApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationController : BaseController
{
    private readonly INotificationService _notificationService;
    private readonly ICourseService _courseService;

    public NotificationController(
        INotificationService notificationService,
        ICourseService courseService)
    {
        _notificationService = notificationService;
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponseDTO<NotificationDTO>>> GetNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] bool sortDescending = true)
    {
        try
        {
            var paginatedNotifications = await _notificationService.GetUserNotificationsAsync(
                UserId, unreadOnly, page, pageSize, sortBy, sortDescending);

            var notificationDtos = paginatedNotifications.Items.Select(n => n.ToDTO()).ToList();

            return HandleResult(new PaginatedResponseDTO<NotificationDTO>
            {
                Items = notificationDtos,
                TotalItems = paginatedNotifications.Total,
                CurrentPage = paginatedNotifications.Page,
                TotalPages = (int)Math.Ceiling(paginatedNotifications.Total / (double)paginatedNotifications.PageSize),
                HasMore = paginatedNotifications.HasMore
            });
        }
        catch (Exception ex)
        {
            return HandleError<PaginatedResponseDTO<NotificationDTO>>(ex);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDTO>> GetNotification(string id)
    {
        try
        {
            if (!int.TryParse(id, out int notificationId))
            {
                return BadRequest("Invalid notification ID format");
            }

            var notification = await _notificationService.GetNotificationByIdAsync(notificationId);
            if (notification == null)
                return HandleNotFound<NotificationDTO>();

            if (notification.UserId != UserId)
                return HandleForbidden<NotificationDTO>();

            return HandleResult(notification.ToDTO());
        }
        catch (Exception ex)
        {
            return HandleError<NotificationDTO>(ex);
        }
    }

    [HttpPost("{id}/read")]
    public async Task<ActionResult> MarkAsRead(string id)
    {
        try
        {
            if (!int.TryParse(id, out int notificationId))
            {
                return BadRequest("Invalid notification ID format");
            }

            var notification = await _notificationService.GetNotificationByIdAsync(notificationId);
            if (notification == null)
                return NotFound();

            if (notification.UserId != UserId)
                return Forbid();

            var result = await _notificationService.MarkAsReadAsync(notificationId);
            return HandleNoContent(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        try
        {
            var result = await _notificationService.MarkAllAsReadAsync(UserId);
            return HandleNoContent(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteNotification(string id)
    {
        try
        {
            if (!int.TryParse(id, out int notificationId))
            {
                return BadRequest("Invalid notification ID format");
            }

            var notification = await _notificationService.GetNotificationByIdAsync(notificationId);
            if (notification == null)
                return NotFound();

            if (notification.UserId != UserId)
                return Forbid();

            var result = await _notificationService.DeleteNotificationAsync(notificationId);
            return HandleNoContent(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete]
    public async Task<ActionResult> DeleteAllNotifications()
    {
        try
        {
            var result = await _notificationService.DeleteAllNotificationsAsync(UserId);
            return HandleNoContent(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<NotificationCountDTO>> GetUnreadCount()
    {
        try
        {
            var count = await _notificationService.GetUnreadCountAsync(UserId);
            return HandleResult(new NotificationCountDTO { UnreadCount = count });
        }
        catch (Exception ex)
        {
            return HandleError<NotificationCountDTO>(ex);
        }
    }

    [HttpGet("preferences")]
    public async Task<ActionResult<NotificationPreferenceDTO>> GetPreferences()
    {
        try
        {
            var preferences = await _notificationService.GetAllUserPreferencesAsync(UserId);
            return HandleResult(preferences.Select(p => p.ToDTO()).FirstOrDefault());
        }
        catch (Exception ex)
        {
            return HandleError<NotificationPreferenceDTO>(ex);
        }
    }

    [HttpPut("preferences")]
    public async Task<ActionResult<NotificationPreferenceDTO>> UpdatePreferences([FromBody] UpdateNotificationPreferenceDTO request)
    {
        try
        {
            var preference = await _notificationService.UpdateUserPreferencesAsync(
                UserId,
                request.Type,
                request.Channel,
                request.IsEnabled);

            return HandleResult(preference.ToDTO());
        }
        catch (Exception ex)
        {
            return HandleError<NotificationPreferenceDTO>(ex);
        }
    }

    [HttpPost("course/{courseId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> SendCourseNotification(
        int courseId,
        [FromBody] CreateCourseNotificationDTO dto)
    {
        try
        {
            // Tarkista, että käyttäjä on kurssin opettaja tai admin
            var course = await _courseService.GetCourseAsync(courseId.ToString());
            if (course == null)
                return NotFound("Kurssia ei löydy");

            if (course.TeacherId != UserId && !User.IsInRole("Admin"))
                return Forbid("Sinulla ei ole oikeuksia lähettää ilmoituksia tälle kurssille");

            var success = await _notificationService.SendCourseNotificationAsync(
                courseId,
                dto.Title,
                dto.Message,
                dto.Type,
                dto.Priority);

            if (!success)
                return BadRequest("Ilmoituksen lähettäminen epäonnistui");

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest($"Virhe: {ex.Message}");
        }
    }
}
