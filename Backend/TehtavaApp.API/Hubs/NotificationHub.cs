using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendNotification(string userId, NotificationDTO notification)
    {
        await Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", notification);
    }

    public async Task SendGroupNotification(int groupId, NotificationDTO notification)
    {
        await Clients.Group($"Group_{groupId}").SendAsync("ReceiveGroupNotification", notification);
    }

    public async Task SendCourseNotification(int courseId, NotificationDTO notification)
    {
        await Clients.Group($"Course_{courseId}").SendAsync("ReceiveCourseNotification", notification);
    }

    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task LeaveUserGroup(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task JoinGroup(int groupId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Group_{groupId}");
    }

    public async Task LeaveGroup(int groupId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Group_{groupId}");
    }

    public async Task JoinCourse(int courseId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Course_{courseId}");
    }

    public async Task LeaveCourse(int courseId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Course_{courseId}");
    }

    public async Task MarkAsRead(int notificationId)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.Group($"User_{userId}").SendAsync("NotificationRead", notificationId);
        }
    }

    public async Task MarkAllAsRead()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.Group($"User_{userId}").SendAsync("AllNotificationsRead");
        }
    }

    public async Task SendNotificationUpdate(string userId, NotificationCountDTO unreadCount)
    {
        await Clients.Group($"User_{userId}").SendAsync("NotificationCountUpdated", unreadCount);
    }

    public async Task SendPreferenceUpdate(string userId, NotificationPreferenceDTO preference)
    {
        await Clients.Group($"User_{userId}").SendAsync("NotificationPreferenceUpdated", preference);
    }
}
