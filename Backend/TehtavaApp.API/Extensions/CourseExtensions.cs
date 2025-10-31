using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Extensions
{
    public static class CourseExtensions
    {
        /// <summary>
        /// Retrieves all active students enrolled in the specified course through groups.
        /// </summary>
        /// <param name="course">The course entity.</param>
        /// <param name="context">The application's database context.</param>
        /// <returns>A list of active students enrolled in the course through groups.</returns>
        public static async Task<IEnumerable<ApplicationUser>> StudentsAsync(this Course course, ApplicationDbContext context)
        {
            // Haetaan kaikki ryhmät, jotka ovat liitetty kurssiin
            var groupIds = await context.SchoolGroups
                .Where(g => g.Courses.Any(c => c.Id == course.Id))
                .Select(g => g.Id)
                .ToListAsync();

            // Haetaan kaikki opiskelijat, jotka ovat näissä ryhmissä
            return await context.StudentGroupEnrollments
                .Where(sge => groupIds.Contains(sge.GroupId) && sge.Status == EnrollmentStatus.Active)
                .Select(sge => sge.Student)
                .Distinct()
                .ToListAsync();
        }

        /// <summary>
        /// Checks if a specific user is an active student in the specified course through groups.
        /// </summary>
        /// <param name="course">The course entity.</param>
        /// <param name="userId">The ID of the user to check.</param>
        /// <param name="context">The application's database context.</param>
        /// <returns>True if the user is an active student in the course through groups; otherwise, false.</returns>
        public static async Task<bool> HasStudentAsync(this Course course, string userId, ApplicationDbContext context)
        {
            // Tarkistetaan, onko opiskelija missään kurssiin liitetyssä ryhmässä
            return await context.SchoolGroups
                .Where(g => g.Courses.Any(c => c.Id == course.Id))
                .AnyAsync(g => g.StudentEnrollments.Any(se => se.StudentId == userId && se.Status == EnrollmentStatus.Active));
        }
    }
}
