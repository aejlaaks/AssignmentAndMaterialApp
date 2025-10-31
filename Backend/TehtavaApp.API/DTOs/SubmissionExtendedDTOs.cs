using System;
using System.Collections.Generic;

namespace Backend.DTOs
{
    public class GradeSubmissionDTO
    {
        public double? Grade { get; set; }
        public string Feedback { get; set; }
        public bool RequiresRevision { get; set; }
        public bool IsRichTextFeedback { get; set; } = false;
        public DateTime? RevisionDueDate { get; set; }
        public List<FeedbackAttachmentDTO> Attachments { get; set; } = new List<FeedbackAttachmentDTO>();
    }

    public class ReturnSubmissionDTO
    {
        public string Feedback { get; set; }
        public bool RequiresRevision { get; set; }
        public bool IsRichTextFeedback { get; set; } = false;
        public DateTime? RevisionDueDate { get; set; }
        public List<FeedbackAttachmentDTO> Attachments { get; set; } = new List<FeedbackAttachmentDTO>();
    }

    public class SubmissionFilterDTO
    {
        public string CourseId { get; set; }
        public string AssignmentId { get; set; }
        public string StudentId { get; set; }
        public string Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
} 