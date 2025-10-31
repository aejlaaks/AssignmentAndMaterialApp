using System;
using System.Collections.Generic;

namespace Backend.DTOs
{
    public class InlineCommentDTO
    {
        public string Id { get; set; }
        public string SubmissionId { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Text { get; set; }
        public int StartOffset { get; set; }
        public int EndOffset { get; set; }
        public string SelectedText { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<FeedbackAttachmentDTO> Attachments { get; set; } = new List<FeedbackAttachmentDTO>();
        
        // Additional properties needed by InlineCommentService
        public int StartPosition { get; set; }
        public int EndPosition { get; set; }
        public string ReferenceId { get; set; }
        public int StartLine { get; set; }
        public int EndLine { get; set; }
        public FeedbackAttachmentDTO Attachment { get; set; }
    }

    public class InlineCommentResponseDTO
    {
        public string Id { get; set; }
        public string SubmissionId { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Text { get; set; }
        public int StartOffset { get; set; }
        public int EndOffset { get; set; }
        public string SelectedText { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<FeedbackAttachmentDTO> Attachments { get; set; } = new List<FeedbackAttachmentDTO>();
        
        // Additional properties needed by InlineCommentController
        public string TeacherId { get; set; }
        public string TeacherName { get; set; }
        public int StartPosition { get; set; }
        public int EndPosition { get; set; }
        public string ReferenceId { get; set; }
        public int StartLine { get; set; }
        public int EndLine { get; set; }
        public DateTime UpdatedAt { get; set; }
        public FeedbackAttachmentDTO Attachment { get; set; }
    }

    public class FeedbackAttachmentDTO
    {
        public string Id { get; set; }
        public string FileName { get; set; }
        public string FileType { get; set; }
        public long FileSize { get; set; }
        public string FileUrl { get; set; }
        public string Description { get; set; }
        public DateTime UploadedAt { get; set; }
    }
} 