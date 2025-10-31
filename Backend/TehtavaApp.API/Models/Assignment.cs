using System;
using System.Collections.Generic;

namespace TehtavaApp.API.Models
{
    public class Assignment
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string ContentMarkdown { get; set; }
        public DateTime DueDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public double? Grade { get; set; }
        public string FeedbackText { get; set; }
        public string CreatedById { get; set; }
        public string GradedById { get; set; }
        public AssignmentStatus Status { get; set; }
        public bool RequiresRevision { get; set; }
        public double? MaxPoints { get; set; }

        // Navigation properties
        public Course Course { get; set; }
        public ApplicationUser CreatedBy { get; set; }
        public ApplicationUser GradedBy { get; set; }
        public ICollection<AssignmentSubmission> Submissions { get; set; }
        public ICollection<UploadedFile> Files { get; set; }

        public Assignment()
        {
            Submissions = new HashSet<AssignmentSubmission>();
            Files = new HashSet<UploadedFile>();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            IsActive = true;
            Status = AssignmentStatus.Draft;
            RequiresRevision = false;
            Grade = null;
            FeedbackText = "No Feedback";
            ContentMarkdown = "";
        }

        public bool IsOverdue()
        {
            return DateTime.UtcNow > DueDate;
        }
    }
}
