using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces;

public interface IGroupService
{
    Task<SchoolGroup> CreateGroupAsync(SchoolGroup group);
    Task<SchoolGroup> GetGroupByIdAsync(int id);
    Task<IEnumerable<SchoolGroup>> GetGroupsAsync();
    Task<IEnumerable<SchoolGroup>> GetTeacherGroupsAsync(string teacherId);
    Task<IEnumerable<SchoolGroup>> GetStudentGroupsAsync(string studentId);
    Task<SchoolGroup> UpdateGroupAsync(SchoolGroup group);
    Task<bool> DeleteGroupAsync(int id);
    Task<bool> AddStudentAsync(int groupId, string studentId);
    Task<bool> RemoveStudentAsync(int groupId, string studentId);
    Task<bool> AddCourseAsync(int groupId, int courseId);
    Task<bool> RemoveCourseAsync(int groupId, int courseId);
    Task<bool> IsStudentInGroupAsync(int groupId, string studentId);
    Task<bool> IsTeacherOfGroupAsync(int groupId, string teacherId);
    Task<IEnumerable<StudentGroupEnrollment>> GetGroupEnrollmentsAsync(int groupId);
    Task<StudentGroupEnrollment> GetStudentEnrollmentAsync(int groupId, string studentId);
}
