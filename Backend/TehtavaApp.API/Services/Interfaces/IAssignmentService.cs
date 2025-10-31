using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces;

    public interface IAssignmentService
    {
        Task<IEnumerable<Assignment>> GetAssignmentsAsync();
        Task<IEnumerable<Assignment>> GetStudentAssignmentsAsync(string userId);
        Task<Assignment> GetAssignmentByIdAsync(int id);
        Task<IEnumerable<Assignment>> GetCourseAssignmentsAsync(int courseId);
        Task<Assignment> CreateAssignmentAsync(Assignment assignment);
        Task<Assignment> UpdateAssignmentAsync(Assignment assignment);
        Task DeleteAssignmentAsync(int id);
        Task<bool> IsUserAuthorizedForAssignmentAsync(string userId, int assignmentId);
        Task<AssignmentSubmission> SubmitAssignmentAsync(AssignmentSubmission submission);
        Task<AssignmentSubmission> GetSubmissionByIdAsync(int id);
        Task<AssignmentSubmission> UpdateSubmissionAsync(AssignmentSubmission submission);
        Task<IEnumerable<AssignmentSubmission>> GetStudentSubmissionsAsync(string studentId);
        Task<IEnumerable<AssignmentSubmission>> GetSubmissionsByAssignmentAsync(int assignmentId);
        Task<AssignmentSubmission> GradeSubmissionAsync(int submissionId, string grade, string feedback, string graderId);
        Task<AssignmentSubmission> ReturnSubmissionAsync(int submissionId, string feedback, string graderId, bool requiresRevision = false);
        Task<object> GetPendingSubmissionsCountAsync(string courseId = null);
        Task<Assignment> GetAssignmentWithSubmissionsAsync(int id);
        Task<IEnumerable<Assignment>> GetRecentAssignmentsForUserAsync(string userId, int count = 5);
        Task<IEnumerable<Assignment>> GetDraftAssignmentsByCourseAsync(int courseId, string teacherId);
        Task<IEnumerable<Assignment>> GetTeacherPublishedAssignmentsByCourseAsync(int courseId, string teacherId);
    }
