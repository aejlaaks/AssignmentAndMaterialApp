using System;
using System.Collections.Generic;

namespace TehtavaApp.API.Models
{
    public class AssignmentSubmission
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public string StudentId { get; set; }
        public string SubmissionText { get; set; }
        public string Content { get => SubmissionText; set => SubmissionText = value; }
        public string Status { get; set; }
        public double? Grade { get; set; }
        public string FeedbackText { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime SubmissionDate { get => SubmittedAt; set => SubmittedAt = value; }
        public DateTime? GradedAt { get; set; }
        public string? GradedById { get; set; }
        public int AttemptNumber { get; set; }
        public bool RequiresRevision { get; set; }
        public ICollection<Material> SubmittedMaterials { get; set; }
        public string? StudentName { get; set; }
        
        // AI Grading fields
        public bool IsAIGraded { get; set; }
        public string? AIGradingMetadata { get; set; }

        // Navigation properties
        public Assignment Assignment { get; set; }
        public ApplicationUser Student { get; set; }
        public ApplicationUser GradedBy { get; set; }

        public AssignmentSubmission()
        {
            SubmittedMaterials = new HashSet<Material>();
            SubmittedAt = DateTime.UtcNow;
            AttemptNumber = 1;
            Status = "submitted";
            IsAIGraded = false;
            AIGradingMetadata = null;
        }

        public bool IsLate()
        {
            return Assignment != null && SubmittedAt > Assignment.DueDate;
        }

        public void MarkAsGraded(string gradedById, double gradeValue, string feedback)
        {
            Grade = gradeValue;
            FeedbackText = feedback;
            GradedById = gradedById;
            GradedAt = DateTime.UtcNow;
            Status = "graded";
        }

        public void MarkAsReturned(string gradedById, string feedback, bool requiresRevision)
        {
            FeedbackText = feedback;
            GradedById = gradedById;
            GradedAt = DateTime.UtcNow;
            RequiresRevision = requiresRevision;
            Status = "returned";
        }

        public void MarkAsAIGraded(string gradedById, double gradeValue, string feedback, string aiMetadata)
        {
            Grade = gradeValue;
            FeedbackText = feedback;
            GradedById = gradedById;
            GradedAt = DateTime.UtcNow;
            Status = "graded";
            IsAIGraded = true;
            AIGradingMetadata = aiMetadata;
        }
    }
}
