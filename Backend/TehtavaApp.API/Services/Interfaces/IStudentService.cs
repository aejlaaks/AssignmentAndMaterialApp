using TehtavaApp.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface IStudentService
    {
        Task<ApplicationUser> GetStudentByIdAsync(string studentId);
        Task<IEnumerable<ApplicationUser>> GetStudentsAsync();
        Task<IEnumerable<ApplicationUser>> GetStudentsByCourseAsync(int courseId);
        Task<IEnumerable<AssignmentSubmission>> GetStudentSubmissionsAsync(string studentId);
        Task<bool> IsStudentEnrolledInCourseAsync(string studentId, int courseId);
        Task<bool> EnrollStudentToCourseAsync(string studentId, int courseId);
        Task<bool> UnenrollStudentFromCourseAsync(string studentId, int courseId);
    }
} 