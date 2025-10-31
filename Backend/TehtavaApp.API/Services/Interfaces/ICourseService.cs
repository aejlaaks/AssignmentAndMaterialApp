using TehtavaApp.API.Models;
using TehtavaApp.API.DTOs;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseListItemDTO>> GetCoursesAsync();
        Task<CourseDTO> GetCourseAsync(string id);
        Task<CourseDTO> CreateCourseAsync(Course course);
        Task<CourseDTO> UpdateCourseAsync(Course course);
        Task DeleteCourseAsync(string id);
        Task<bool> CanManageCourseAsync(string courseId, string userId);
        Task<CourseStatsDTO> GetCourseStatsAsync(string id);
        Task<CourseDetailDTO> GetCourseDetailAsync(string courseId, string userId);
        Task<IEnumerable<CourseListItemDTO>> GetUserCoursesAsync(string userId);
        Task<IEnumerable<CourseListItemDTO>> GetTeachingCoursesAsync(string userId);
        Task<bool> ExportCourseMaterialsAsync(int courseId, string format);
        Task<IEnumerable<SchoolGroup>> GetCourseGroupsAsync(string courseId);
        Task<IEnumerable<UserDTO>> GetCourseStudentsAsync(string courseId);
        Task<bool> DoesCourseExistAsync(int courseId);
        
        // New methods for managing course teachers
        Task<IEnumerable<UserDTO>> GetCourseTeachersAsync(string courseId);
        Task<bool> AddCourseTeacherAsync(string courseId, string teacherId);
        Task<bool> RemoveCourseTeacherAsync(string courseId, string teacherId);
    }
}
