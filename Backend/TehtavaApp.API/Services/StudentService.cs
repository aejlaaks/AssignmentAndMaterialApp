using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Services
{
    public class StudentService : IStudentService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public StudentService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<ApplicationUser> GetStudentByIdAsync(string studentId)
        {
            return await _userManager.FindByIdAsync(studentId);
        }

        public async Task<IEnumerable<ApplicationUser>> GetStudentsAsync()
        {
            var studentRoleId = await _context.Roles.Where(r => r.Name == "Student").Select(r => r.Id).FirstOrDefaultAsync();
            var studentUserIds = await _context.UserRoles.Where(ur => ur.RoleId == studentRoleId).Select(ur => ur.UserId).ToListAsync();
            
            return await _context.Users.Where(u => studentUserIds.Contains(u.Id)).ToListAsync();
        }

        public async Task<IEnumerable<ApplicationUser>> GetStudentsByCourseAsync(int courseId)
        {
            // Get all students enrolled in the course through groups
            var course = await _context.Courses
                .Include(c => c.Groups)
                    .ThenInclude(g => g.StudentEnrollments)
                        .ThenInclude(e => e.Student)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return new List<ApplicationUser>();

            return course.Groups
                .SelectMany(g => g.StudentEnrollments)
                .Where(e => e.Status == EnrollmentStatus.Active)
                .Select(e => e.Student)
                .Distinct()
                .ToList();
        }

        public async Task<IEnumerable<AssignmentSubmission>> GetStudentSubmissionsAsync(string studentId)
        {
            return await _context.AssignmentSubmissions
                .Include(s => s.Assignment)
                .Where(s => s.StudentId == studentId)
                .ToListAsync();
        }

        public async Task<bool> IsStudentEnrolledInCourseAsync(string studentId, int courseId)
        {
            var course = await _context.Courses
                .Include(c => c.Groups)
                    .ThenInclude(g => g.StudentEnrollments)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return false;

            return course.Groups
                .SelectMany(g => g.StudentEnrollments)
                .Any(e => e.StudentId == studentId && e.Status == EnrollmentStatus.Active);
        }

        public async Task<bool> EnrollStudentToCourseAsync(string studentId, int courseId)
        {
            // Check if student is already enrolled
            if (await IsStudentEnrolledInCourseAsync(studentId, courseId))
                return true;

            // Find a group for this course where the student can be enrolled
            var courseGroup = await _context.SchoolGroups
                .FirstOrDefaultAsync(g => g.Courses.Any(c => c.Id == courseId));

            // If no groups exist, create one
            if (courseGroup == null)
            {
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                    return false;

                courseGroup = new SchoolGroup
                {
                    Name = $"{course.Name} - Default Group",
                    Description = "Default group for course",
                    IsActive = true,
                    CreatedById = course.TeacherId
                };

                courseGroup.Courses.Add(course);
                _context.SchoolGroups.Add(courseGroup);
                await _context.SaveChangesAsync();
            }

            // Enroll student to the group

            var enrollment = new StudentGroupEnrollment
            {
                GroupId = courseGroup.Id,
                StudentId = studentId,
                Status = EnrollmentStatus.Active,
                EnrolledAt = DateTime.UtcNow
            };

            _context.StudentGroupEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UnenrollStudentFromCourseAsync(string studentId, int courseId)
        {
            var enrollments = await _context.StudentGroupEnrollments
                .Include(e => e.Group)
                    .ThenInclude(g => g.Courses)
                .Where(e => e.StudentId == studentId && e.Group.Courses.Any(c => c.Id == courseId))
                .ToListAsync();

            if (!enrollments.Any())
                return false;

            foreach (var enrollment in enrollments)
            {
                enrollment.Status = EnrollmentStatus.Inactive;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
} 