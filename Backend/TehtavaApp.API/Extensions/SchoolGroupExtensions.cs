using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Extensions;

public static class SchoolGroupExtensions
{
    public static ICollection<ApplicationUser> Students(this SchoolGroup group)
    {
        return group.StudentEnrollments?
            .Where(se => se.Status == EnrollmentStatus.Active)
            .Select(se => se.Student)
            .ToList() ?? new List<ApplicationUser>();
    }

    public static async Task<ICollection<ApplicationUser>> StudentsAsync(this SchoolGroup group, ApplicationDbContext context)
    {
        if (group.StudentEnrollments == null)
        {
            var enrollments = await context.StudentGroupEnrollments
                .Include(se => se.Student)
                .Where(se => se.GroupId == group.Id && se.Status == EnrollmentStatus.Active)
                .ToListAsync();
            group.StudentEnrollments = enrollments;
        }

        return group.Students();
    }

    public static bool HasStudent(this SchoolGroup group, string studentId)
    {
        return group.StudentEnrollments?
            .Any(se => se.StudentId == studentId && se.Status == EnrollmentStatus.Active) ?? false;
    }

    public static async Task<bool> HasStudentAsync(this SchoolGroup group, string studentId, ApplicationDbContext context)
    {
        if (group.StudentEnrollments == null)
        {
            return await context.StudentGroupEnrollments
                .AnyAsync(se => se.GroupId == group.Id && 
                               se.StudentId == studentId && 
                               se.Status == EnrollmentStatus.Active);
        }

        return group.HasStudent(studentId);
    }

    public static async Task<int> GetStudentCountAsync(this SchoolGroup group, ApplicationDbContext context)
    {
        if (group.StudentEnrollments == null)
        {
            return await context.StudentGroupEnrollments
                .CountAsync(se => se.GroupId == group.Id && se.Status == EnrollmentStatus.Active);
        }

        return group.StudentEnrollments.Count(se => se.Status == EnrollmentStatus.Active);
    }
}
