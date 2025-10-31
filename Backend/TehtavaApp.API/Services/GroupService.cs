using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Extensions;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Services;

public class GroupService : IGroupService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;

    public GroupService(
        ApplicationDbContext context,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _notificationService = notificationService;
        _userManager = userManager;
    }

    public async Task<SchoolGroup> CreateGroupAsync(SchoolGroup group)
    {
        _context.SchoolGroups.Add(group);
        await _context.SaveChangesAsync();

        // Notify creator
        await _notificationService.CreateNotificationAsync(new Notification
        {
            UserId = group.CreatedById,
            Title = "New Group Created",
            Message = $"You have created the group {group.Name}",
            Type = NotificationType.Group,
            RelatedId = group.Id
        });

        return group;
    }

    public async Task<SchoolGroup> GetGroupByIdAsync(int id)
    {
        return await _context.SchoolGroups
            .Include(g => g.CreatedBy)
            .Include(g => g.StudentEnrollments)
                .ThenInclude(se => se.Student)
            .Include(g => g.Courses)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<IEnumerable<SchoolGroup>> GetGroupsAsync()
    {
        return await _context.SchoolGroups
            .Include(g => g.CreatedBy)
            .Include(g => g.StudentEnrollments)
                .ThenInclude(se => se.Student)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<SchoolGroup>> GetTeacherGroupsAsync(string teacherId)
    {
        return await _context.SchoolGroups
            .Include(g => g.CreatedBy)
            .Include(g => g.StudentEnrollments)
                .ThenInclude(se => se.Student)
            .Where(g => g.CreatedById == teacherId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<SchoolGroup>> GetStudentGroupsAsync(string studentId)
    {
        return await _context.SchoolGroups
            .Include(g => g.CreatedBy)
            .Include(g => g.StudentEnrollments)
                .ThenInclude(se => se.Student)
            .Where(g => g.StudentEnrollments.Any(se => se.StudentId == studentId))
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    public async Task<SchoolGroup> UpdateGroupAsync(SchoolGroup group)
    {
        var existingGroup = await _context.SchoolGroups
            .Include(g => g.StudentEnrollments)
                .ThenInclude(se => se.Student)
            .FirstOrDefaultAsync(g => g.Id == group.Id);

        if (existingGroup == null)
            return null;

        existingGroup.Name = group.Name;
        existingGroup.Description = group.Description;
        existingGroup.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notify students
        var students = await existingGroup.StudentsAsync(_context);
        foreach (var student in students)
        {
            await _notificationService.CreateNotificationAsync(new Notification
            {
                UserId = student.Id,
                Title = "Group Updated",
                Message = $"Group {existingGroup.Name} has been updated",
                Type = NotificationType.GroupUpdate,
                RelatedId = existingGroup.Id
            });
        }

        return existingGroup;
    }

    public async Task<bool> DeleteGroupAsync(int id)
    {
        var group = await _context.SchoolGroups.FindAsync(id);
        if (group == null)
            return false;

        _context.SchoolGroups.Remove(group);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddStudentAsync(int groupId, string studentId)
    {
        var group = await _context.SchoolGroups
            .Include(g => g.StudentEnrollments)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
            return false;

        if (await group.HasStudentAsync(studentId, _context))
            return true;

        var enrollment = new StudentGroupEnrollment
        {
            GroupId = groupId,
            StudentId = studentId,
            Status = EnrollmentStatus.Active,
            EnrolledAt = DateTime.UtcNow
        };

        group.StudentEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        // Notify student
        await _notificationService.CreateNotificationAsync(new Notification
        {
            UserId = studentId,
            Title = "Added to Group",
            Message = $"You have been added to the group {group.Name}",
            Type = NotificationType.GroupEnrollment,
            RelatedId = groupId
        });

        return true;
    }

    public async Task<bool> RemoveStudentAsync(int groupId, string studentId)
    {
        var enrollment = await _context.StudentGroupEnrollments
            .FirstOrDefaultAsync(e => e.GroupId == groupId && e.StudentId == studentId);

        if (enrollment == null)
            return true;

        _context.StudentGroupEnrollments.Remove(enrollment);
        await _context.SaveChangesAsync();

        var group = await _context.SchoolGroups.FindAsync(groupId);
        if (group != null)
        {
            // Notify student
            await _notificationService.CreateNotificationAsync(new Notification
            {
                UserId = studentId,
                Title = "Removed from Group",
                Message = $"You have been removed from the group {group.Name}",
                Type = NotificationType.GroupUpdate,
                RelatedId = groupId
            });
        }

        return true;
    }

    public async Task<bool> AddCourseAsync(int groupId, int courseId)
    {
        Console.WriteLine($"DEBUG: AddCourseAsync kutsuttu - groupId: {groupId}, courseId: {courseId}");
        
        var group = await _context.SchoolGroups
            .Include(g => g.Courses)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
        {
            Console.WriteLine($"DEBUG: Ryhmää ei löydy ID:llä {groupId}");
            return false;
        }

        Console.WriteLine($"DEBUG: Ryhmä löytyi: {group.Name}, kursseja: {group.Courses.Count}");
        
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            Console.WriteLine($"DEBUG: Kurssia ei löydy ID:llä {courseId}");
            return false;
        }

        Console.WriteLine($"DEBUG: Kurssi löytyi: {course.Name}");
        
        if (group.Courses.Any(c => c.Id == courseId))
        {
            Console.WriteLine($"DEBUG: Kurssi {courseId} on jo lisätty ryhmään {groupId}");
            return true;
        }

        Console.WriteLine($"DEBUG: Lisätään kurssi {course.Name} ryhmään {group.Name}");
        group.Courses.Add(course);
        
        // Tarkistetaan myös, että kurssin Groups-kokoelmassa on tämä ryhmä
        if (!course.Groups.Any(g => g.Id == groupId))
        {
            Console.WriteLine($"DEBUG: Lisätään ryhmä {group.Name} kurssin {course.Name} ryhmiin");
            course.Groups.Add(group);
        }
        
        await _context.SaveChangesAsync();
        Console.WriteLine($"DEBUG: Kurssi {course.Name} lisätty onnistuneesti ryhmään {group.Name}");
        
        return true;
    }

    public async Task<bool> RemoveCourseAsync(int groupId, int courseId)
    {
        var group = await _context.SchoolGroups
            .Include(g => g.Courses)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
            return false;

        var course = group.Courses.FirstOrDefault(c => c.Id == courseId);
        if (course == null)
            return true;

        group.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsStudentInGroupAsync(int groupId, string studentId)
    {
        // Check if user is admin (admins have access to all groups)
        var user = await _userManager.FindByIdAsync(studentId);
        if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
            return true;

        var group = await _context.SchoolGroups
            .Include(g => g.StudentEnrollments)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        return group != null && await group.HasStudentAsync(studentId, _context);
    }

    public async Task<bool> IsTeacherOfGroupAsync(int groupId, string teacherId)
    {
        // Check if user is admin (admins are considered teachers of all groups)
        var user = await _userManager.FindByIdAsync(teacherId);
        if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
            return true;

        var group = await _context.SchoolGroups.FindAsync(groupId);
        return group?.CreatedById == teacherId;
    }

    public async Task<IEnumerable<StudentGroupEnrollment>> GetGroupEnrollmentsAsync(int groupId)
    {
        return await _context.StudentGroupEnrollments
            .Include(e => e.Student)
            .Where(e => e.GroupId == groupId)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();
    }

    public async Task<StudentGroupEnrollment> GetStudentEnrollmentAsync(int groupId, string studentId)
    {
        return await _context.StudentGroupEnrollments
            .Include(e => e.Student)
            .FirstOrDefaultAsync(e => e.GroupId == groupId && e.StudentId == studentId);
    }
}
