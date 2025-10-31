using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    public class Submission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssignmentId { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string StudentId { get; set; }

        public string StudentName { get; set; }

        [Required]
        public string SubmissionText { get; set; }

        [Required]
        public string Status { get; set; } // "Submitted", "Late", "Returned", etc.

        [Required]
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public DateTime? GradedAt { get; set; }

        public double? Grade { get; set; }

        public string FeedbackText { get; set; }

        public bool IsRichTextFeedback { get; set; } = false;

        [BsonRepresentation(BsonType.ObjectId)]
        public string GradedById { get; set; }

        public string GradedByName { get; set; }

        public int AttemptNumber { get; set; } = 1;

        public bool RequiresRevision { get; set; }

        public bool IsLate { get; set; }

        public List<SubmissionMaterial> SubmittedMaterials { get; set; } = new List<SubmissionMaterial>();

        public List<FeedbackAttachment> FeedbackAttachments { get; set; } = new List<FeedbackAttachment>();

        public List<string> InlineCommentIds { get; set; } = new List<string>();

        public string AssignmentTitle { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string CourseId { get; set; }

        public string CourseName { get; set; }

        public DateTime? RevisionDueDate { get; set; }
    }

    public class SubmissionMaterial
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        public string FileName { get; set; }

        [Required]
        public string FileType { get; set; }

        [Required]
        public string FileUrl { get; set; }

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
} 