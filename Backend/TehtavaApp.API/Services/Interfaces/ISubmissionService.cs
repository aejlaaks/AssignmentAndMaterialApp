using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public interface ISubmissionService
    {
        Task<IEnumerable<Submission>> GetSubmissionsByAssignmentAsync(string assignmentId);
        Task<IEnumerable<Submission>> GetSubmissionsByStudentAsync(string studentId);
        Task<IEnumerable<Submission>> GetSubmissionsByCourseAsync(string courseId);
        Task<IEnumerable<Submission>> GetPendingSubmissionsAsync(SubmissionFilterDTO filter = null);
        Task<int> GetPendingSubmissionsCountAsync(string courseId = null);
        Task<Submission> GetSubmissionByIdAsync(string id);
        Task<Submission> CreateSubmissionAsync(Submission submission);
        Task<Submission> UpdateSubmissionAsync(string id, Submission submission);
        Task<Submission> GradeSubmissionAsync(string id, GradeSubmissionDTO gradeData);
        Task<Submission> ReturnSubmissionAsync(string id, ReturnSubmissionDTO returnData);
        
        // New methods for feedback attachments
        Task<bool> AddFeedbackAttachmentAsync(string submissionId, FeedbackAttachmentDTO attachmentDto);
        Task<bool> RemoveFeedbackAttachmentAsync(string submissionId, string attachmentId);
    }
} 