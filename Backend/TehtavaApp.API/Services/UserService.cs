using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Extensions;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public UserService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        _userManager = userManager;
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ApplicationUser> GetUserByIdAsync(string userId)
    {
        return await _userManager.FindByIdAsync(userId);
    }

    public async Task<ApplicationUser> GetUserByEmailAsync(string email)
    {
        return await _userManager.FindByEmailAsync(email);
    }

    public async Task<IEnumerable<ApplicationUser>> GetUsersByRoleAsync(string role)
    {
        return await _userManager.GetUsersInRoleAsync(role);
    }

    public async Task<IEnumerable<string>> GetUserRolesAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return new List<string>();

        return await _userManager.GetRolesAsync(user);
    }

    public async Task<IdentityResult> UpdateUserAsync(ApplicationUser user)
    {
        var existingUser = await _userManager.FindByIdAsync(user.Id);
        if (existingUser == null)
            return IdentityResult.Failed(new IdentityError { Description = "User not found" });

        existingUser.Email = user.Email;
        existingUser.FirstName = user.FirstName;
        existingUser.LastName = user.LastName;
        existingUser.PhoneNumber = user.PhoneNumber;
        existingUser.Bio = user.Bio;
        existingUser.UpdatedAt = DateTime.UtcNow;

        return await _userManager.UpdateAsync(existingUser);
    }

    public async Task<IdentityResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return IdentityResult.Failed(new IdentityError { Description = "User not found" });

        return await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
    }

    public async Task<bool> IsInRoleAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        return await _userManager.IsInRoleAsync(user, role);
    }

    public async Task<IEnumerable<Course>> GetUserCoursesAsync(string userId)
    {
        var teachingCourses = await _context.Courses
            .Where(c => c.TeacherId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Haetaan kurssit, joihin opiskelija on ilmoittautunut ryhmien kautta
        var enrolledCourseIds = await _context.StudentGroupEnrollments
            .Where(sge => sge.StudentId == userId && sge.Status == EnrollmentStatus.Active)
            .Join(_context.SchoolGroups, 
                  sge => sge.GroupId, 
                  g => g.Id, 
                  (sge, g) => g)
            .SelectMany(g => g.Courses.Select(c => c.Id))
            .Distinct()
            .ToListAsync();

        var enrolledCourses = await _context.Courses
            .Include(c => c.Teacher)
            .Include(c => c.Groups)
            .Where(c => enrolledCourseIds.Contains(c.Id))
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return teachingCourses.Concat(enrolledCourses).Distinct();
    }

    public async Task<IEnumerable<SchoolGroup>> GetUserGroupsAsync(string userId)
    {
        var createdGroups = await _context.SchoolGroups
            .Include(g => g.CreatedBy)
            .Include(g => g.StudentEnrollments)
                .ThenInclude(se => se.Student)
            .Where(g => g.CreatedById == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        var enrolledGroups = await _context.StudentGroupEnrollments
            .Include(ge => ge.Group)
                .ThenInclude(g => g.CreatedBy)
            .Include(ge => ge.Group)
                .ThenInclude(g => g.StudentEnrollments)
                    .ThenInclude(se => se.Student)
            .Where(ge => ge.StudentId == userId)
            .Select(ge => ge.Group)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        return createdGroups.Concat(enrolledGroups).Distinct();
    }

    public async Task<bool> AddToGroupAsync(string userId, int groupId)
    {
        var group = await _context.SchoolGroups
            .Include(g => g.StudentEnrollments)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
            return false;

        if (await group.HasStudentAsync(userId, _context))
            return true;

        var enrollment = new StudentGroupEnrollment
        {
            GroupId = groupId,
            StudentId = userId,
            Status = EnrollmentStatus.Active,
            EnrolledAt = DateTime.UtcNow
        };

        group.StudentEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(new Notification
        {
            UserId = userId,
            Title = "Added to Group",
            Message = $"You have been added to the group: {group.Name}",
            Type = NotificationType.GroupEnrollment,
            RelatedId = groupId
        });

        return true;
    }

    public async Task<bool> RemoveFromGroupAsync(string userId, int groupId)
    {
        var enrollment = await _context.StudentGroupEnrollments
            .FirstOrDefaultAsync(e => e.GroupId == groupId && e.StudentId == userId);

        if (enrollment == null)
            return true;

        _context.StudentGroupEnrollments.Remove(enrollment);
        await _context.SaveChangesAsync();

        var group = await _context.SchoolGroups.FindAsync(groupId);
        if (group != null)
        {
            await _notificationService.CreateNotificationAsync(new Notification
            {
                UserId = userId,
                Title = "Removed from Group",
                Message = $"You have been removed from the group: {group.Name}",
                Type = NotificationType.GroupUpdate,
                RelatedId = groupId
            });
        }

        return true;
    }

    public async Task<IEnumerable<ApplicationUser>> SearchUsersAsync(string searchTerm)
    {
        return await _userManager.Users
            .Where(u => u.Email.Contains(searchTerm) ||
                       u.FirstName.Contains(searchTerm) ||
                       u.LastName.Contains(searchTerm))
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();
    }

    public async Task<bool> DeactivateUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            await _notificationService.CreateNotificationAsync(new Notification
            {
                UserId = userId,
                Title = "Account Deactivated",
                Message = "Your account has been deactivated",
                Type = NotificationType.AccountDeactivation,
                RelatedId = null
            });
        }

        return result.Succeeded;
    }

    public async Task<bool> ReactivateUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            await _notificationService.CreateNotificationAsync(new Notification
            {
                UserId = userId,
                Title = "Account Reactivated",
                Message = "Your account has been reactivated",
                Type = NotificationType.AccountActivation,
                RelatedId = null
            });
        }

        return result.Succeeded;
    }

    public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly = false)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }
}
