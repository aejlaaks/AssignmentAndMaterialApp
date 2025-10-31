using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TehtavaApp.API.Data;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.Extensions;

namespace TehtavaApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserController : BaseController
{
    private readonly IUserService _userService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public UserController(
        IUserService userService,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        _userService = userService;
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<UserResponseDTO>> GetUserProfile()
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(UserId);
            if (user == null)
                return HandleNotFound<UserResponseDTO>();

            var roles = await _userService.GetUserRolesAsync(UserId);
            var courses = await _userService.GetUserCoursesAsync(UserId);
            var groups = await _userService.GetUserGroupsAsync(UserId);

            var teachingCourses = await Task.WhenAll(
                courses.Where(c => c.TeacherId == UserId)
                    .Select(MapToUserCourseDTO));

            var enrolledCourseIds = new List<int>();
            foreach (var course in courses)
            {
                if (await course.HasStudentAsync(UserId, _context))
                {
                    enrolledCourseIds.Add(course.Id);
                }
            }

            var enrolledCourses = await Task.WhenAll(
                courses.Where(c => enrolledCourseIds.Contains(c.Id))
                    .Select(MapToUserCourseDTO));

            var groupsList = await Task.WhenAll(
                groups.Select(MapToUserGroupDTO));

            var response = new UserResponseDTO
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Role = user.PrimaryRole ?? "Student",
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                Roles = roles.ToList(),
                TeachingCourses = teachingCourses.ToList(),
                EnrolledCourses = enrolledCourses.ToList(),
                Groups = groupsList.ToList()
            };

            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError<UserResponseDTO>(ex);
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UserResponseDTO>> UpdateUserProfile(UserUpdateDTO dto)
    {
        try
        {
            if (UserId != dto.Id)
                return HandleBadRequest<UserResponseDTO>("ID mismatch");

            var user = await _userService.GetUserByIdAsync(UserId);
            if (user == null)
                return HandleNotFound<UserResponseDTO>();

            user.Email = dto.Email;
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;
            user.Bio = dto.Bio;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userService.UpdateUserAsync(user);
            if (!result.Succeeded)
                return HandleBadRequest<UserResponseDTO>(string.Join(", ", result.Errors.Select(e => e.Description)));

            return await GetUserProfile();
        }
        catch (Exception ex)
        {
            return HandleError<UserResponseDTO>(ex);
        }
    }

    [HttpGet("search")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<IEnumerable<UserSearchResultDTO>>> SearchUsers([FromQuery] string searchTerm)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return HandleBadRequest<IEnumerable<UserSearchResultDTO>>("Search term is required");

            var users = await _userService.SearchUsersAsync(searchTerm);
            var results = new List<UserSearchResultDTO>();

            foreach (var user in users)
            {
                var roles = await _userService.GetUserRolesAsync(user.Id);
                var groups = await _userService.GetUserGroupsAsync(user.Id);
                var courses = await _userService.GetUserCoursesAsync(user.Id);

                results.Add(new UserSearchResultDTO
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    UserName = user.UserName ?? "",
                    FirstName = user.FirstName ?? "",
                    LastName = user.LastName ?? "",
                    Role = user.PrimaryRole ?? "Student",
                    IsActive = user.IsActive,
                    Roles = roles.ToList(),
                    Groups = groups.Select(g => g.Name).ToList(),
                    Courses = courses.Select(c => c.Name).ToList()
                });
            }

            return HandleListResult(results);
        }
        catch (Exception ex)
        {
            return HandleErrorForList<UserSearchResultDTO>(ex);
        }
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications([FromQuery] bool unreadOnly = false)
    {
        try
        {
            var notifications = await _userService.GetUserNotificationsAsync(UserId, unreadOnly);
            return HandleListResult(notifications);
        }
        catch (Exception ex)
        {
            return HandleErrorForList<Notification>(ex);
        }
    }

    [HttpPost("{userId}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeactivateUser(string userId)
    {
        try
        {
            var success = await _userService.DeactivateUserAsync(userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("{userId}/reactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ReactivateUser(string userId)
    {
        try
        {
            var success = await _userService.ReactivateUserAsync(userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("roles/{role}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<IEnumerable<UserListItemDTO>>> GetUsersByRole(string role)
    {
        try
        {
            var users = await _userService.GetUsersByRoleAsync(role);
            return HandleListResult(users.Select(MapToListItemDTO).ToList());
        }
        catch (Exception ex)
        {
            return HandleErrorForList<UserListItemDTO>(ex);
        }
    }

    private static UserListItemDTO MapToListItemDTO(ApplicationUser user) => new()
    {
        Id = user.Id,
        Email = user.Email ?? "",
        UserName = user.UserName ?? "",
        FirstName = user.FirstName ?? "",
        LastName = user.LastName ?? "",
        Role = user.PrimaryRole ?? "Student",
        IsActive = user.IsActive,
        CourseCount = (user.TeachingCourses?.Count ?? 0) + (user.GroupEnrollments?.Count ?? 0),
        GroupCount = user.GroupEnrollments?.Count ?? 0,
        LastActive = user.LastActive
    };

    private async Task<UserCourseDTO> MapToUserCourseDTO(Course course)
    {
        var students = await course.StudentsAsync(_context);
        return new UserCourseDTO
        {
            Id = course.Id.ToString(),
            Name = course.Name,
            Description = course.Description,
            StartDate = course.StartDate,
            EndDate = course.EndDate,
            IsActive = course.IsActive,
            StudentCount = students.Count()
        };
    }

    private async Task<UserGroupDTO> MapToUserGroupDTO(SchoolGroup group)
    {
        var students = await group.StudentsAsync(_context);
        return new UserGroupDTO
        {
            Id = group.Id.ToString(),
            Name = group.Name,
            Description = group.Description,
            IsActive = group.IsActive,
            MemberCount = students.Count(),
            StudentCount = students.Count()
        };
    }
}
