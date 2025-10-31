using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public interface IInlineCommentService
    {
        Task<IEnumerable<InlineComment>> GetCommentsBySubmissionAsync(string submissionId);
        Task<InlineComment> GetCommentByIdAsync(string id);
        Task<InlineComment> CreateCommentAsync(InlineCommentDTO commentDto, string teacherId, string teacherName);
        Task<InlineComment> UpdateCommentAsync(string id, InlineCommentDTO commentDto);
        Task<bool> DeleteCommentAsync(string id);
        Task<bool> AddAttachmentToCommentAsync(string commentId, FeedbackAttachmentDTO attachmentDto);
        Task<bool> RemoveAttachmentFromCommentAsync(string commentId);
    }
} 