using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GroupController : BaseController
{
    private readonly IGroupService _groupService;
    private readonly ICourseService _courseService;
    private readonly INotificationService _notificationService;

    public GroupController(
        IGroupService groupService,
        ICourseService courseService,
        INotificationService notificationService)
    {
        _groupService = groupService;
        _courseService = courseService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SchoolGroup>>> GetGroups()
    {
        try
        {
            // Debug information
            var isAdminValue = IsAdmin;
            var isTeacherValue = IsTeacher;
            var isStudentValue = IsStudent;
            var userId = UserId;
            var userRoles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            
            Console.WriteLine($"DEBUG - User ID: {userId}");
            Console.WriteLine($"DEBUG - IsAdmin: {isAdminValue}");
            Console.WriteLine($"DEBUG - IsTeacher: {isTeacherValue}");
            Console.WriteLine($"DEBUG - IsStudent: {isStudentValue}");
            Console.WriteLine($"DEBUG - User Roles: {string.Join(", ", userRoles)}");
            
            IEnumerable<SchoolGroup> groups;
            
            // Force using GetGroupsAsync for testing
            groups = await _groupService.GetGroupsAsync();
            Console.WriteLine($"DEBUG - Retrieved {groups.Count()} groups");
            
            return HandleListResult(groups);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DEBUG - Error in GetGroups: {ex.Message}");
            return HandleErrorForList<SchoolGroup>(ex);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SchoolGroup>> GetGroup(int id)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return HandleNotFound<SchoolGroup>();

            if (!IsTeacher && !await _groupService.IsStudentInGroupAsync(id, UserId))
                return HandleForbidden<SchoolGroup>();

            return HandleResult(group);
        }
        catch (Exception ex)
        {
            return HandleError<SchoolGroup>(ex);
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<ActionResult<SchoolGroup>> CreateGroup([FromBody] object groupData)
    {
        try
        {
            Console.WriteLine($"DEBUG - Received group data: {groupData}");
            
            // Extract name and description from the request
            var name = "";
            var description = "";
            
            try
            {
                // Try to parse as dynamic object
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(groupData.ToString());
                name = data.name;
                description = data.description;
            }
            catch
            {
                // If that fails, try to parse as SchoolGroup
                var group = Newtonsoft.Json.JsonConvert.DeserializeObject<SchoolGroup>(groupData.ToString());
                name = group.Name;
                description = group.Description;
            }
            
            if (string.IsNullOrEmpty(name))
            {
                return BadRequest("Name is required");
            }
            
            // Create a new SchoolGroup with the extracted data
            var newGroup = new SchoolGroup
            {
                Name = name,
                Description = description ?? $"Group for {name}",
                CreatedById = UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };
            
            Console.WriteLine($"DEBUG - Creating group: {newGroup.Name}, CreatedById: {newGroup.CreatedById}");
            
            var createdGroup = await _groupService.CreateGroupAsync(newGroup);
            return HandleCreated(createdGroup, nameof(GetGroup), new { id = createdGroup.Id });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DEBUG - Error in CreateGroup: {ex.Message}");
            Console.WriteLine($"DEBUG - Stack trace: {ex.StackTrace}");
            return HandleError<SchoolGroup>(ex);
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateGroup(int id, SchoolGroup group)
    {
        try
        {
            if (id != group.Id)
                return BadRequest("ID mismatch");

            var existingGroup = await _groupService.GetGroupByIdAsync(id);
            if (existingGroup == null)
                return NotFound();

            if (existingGroup.CreatedById != UserId && !IsAdmin)
                return Forbid();

            var updatedGroup = await _groupService.UpdateGroupAsync(group);
            if (updatedGroup == null)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteGroup(int id)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return NotFound();

            if (group.CreatedById != UserId && !IsAdmin)
                return Forbid();

            var result = await _groupService.DeleteGroupAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("{id}/students/{studentId}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult> AddStudent(int id, string studentId)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return NotFound();

            // Teachers and admins can add students to any group
            // No need to check if the user is the creator of the group

            var result = await _groupService.AddStudentAsync(id, studentId);
            if (!result)
                return BadRequest("Failed to add student to group");

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("{id}/students/{studentId}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult> RemoveStudent(int id, string studentId)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return NotFound();

            // Teachers and admins can remove students from any group
            // No need to check if the user is the creator of the group

            var result = await _groupService.RemoveStudentAsync(id, studentId);
            if (!result)
                return BadRequest("Failed to remove student from group");

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("{id}/courses/{courseId}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult> AddCourse(int id, int courseId)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return NotFound();

            if (group.CreatedById != UserId && !IsAdmin)
                return Forbid();

            var result = await _groupService.AddCourseAsync(id, courseId);
            if (!result)
                return BadRequest("Failed to add course to group");

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("{id}/courses/{courseId}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult> RemoveCourse(int id, int courseId)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return NotFound();

            if (group.CreatedById != UserId && !IsAdmin)
                return Forbid();

            var result = await _groupService.RemoveCourseAsync(id, courseId);
            if (!result)
                return BadRequest("Failed to remove course from group");

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("{id}/enrollments")]
    public async Task<ActionResult<IEnumerable<StudentGroupEnrollment>>> GetEnrollments(int id)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return HandleNotFound<IEnumerable<StudentGroupEnrollment>>();

            if (!IsAdmin && !IsTeacher && !await _groupService.IsStudentInGroupAsync(id, UserId))
                return HandleForbidden<IEnumerable<StudentGroupEnrollment>>();

            var enrollments = await _groupService.GetGroupEnrollmentsAsync(id);
            return HandleListResult(enrollments);
        }
        catch (Exception ex)
        {
            return HandleErrorForList<StudentGroupEnrollment>(ex);
        }
    }

    [HttpGet("{id}/enrollments/{studentId}")]
    public async Task<ActionResult<StudentGroupEnrollment>> GetStudentEnrollment(int id, string studentId)
    {
        try
        {
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group == null)
                return HandleNotFound<StudentGroupEnrollment>();

            if (!IsAdmin && group.CreatedById != UserId && studentId != UserId)
                return HandleForbidden<StudentGroupEnrollment>();

            var enrollment = await _groupService.GetStudentEnrollmentAsync(id, studentId);
            if (enrollment == null)
                return HandleNotFound<StudentGroupEnrollment>();

            return HandleResult(enrollment);
        }
        catch (Exception ex)
        {
            return HandleError<StudentGroupEnrollment>(ex);
        }
    }
}
