using TehtavaApp.API.Models;
using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Services.Interfaces;

public interface IUserService
{
    Task<ApplicationUser> GetUserByIdAsync(string userId);
    Task<ApplicationUser> GetUserByEmailAsync(string email);
    Task<IEnumerable<ApplicationUser>> GetUsersByRoleAsync(string role);
    Task<IEnumerable<string>> GetUserRolesAsync(string userId);
    Task<IdentityResult> UpdateUserAsync(ApplicationUser user);
    Task<IdentityResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    Task<bool> IsInRoleAsync(string userId, string role);
    Task<IEnumerable<Course>> GetUserCoursesAsync(string userId);
    Task<IEnumerable<SchoolGroup>> GetUserGroupsAsync(string userId);
    Task<bool> AddToGroupAsync(string userId, int groupId);
    Task<bool> RemoveFromGroupAsync(string userId, int groupId);
    Task<IEnumerable<ApplicationUser>> SearchUsersAsync(string searchTerm);
    Task<bool> DeactivateUserAsync(string userId);
    Task<bool> ReactivateUserAsync(string userId);
    Task<IEnumerable<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly = false);
}
