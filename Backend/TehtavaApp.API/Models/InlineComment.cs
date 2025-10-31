using System;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    public class InlineComment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SubmissionId { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string TeacherId { get; set; }

        public string TeacherName { get; set; }

        [Required]
        public string Text { get; set; }

        // Position information
        [Required]
        public int StartPosition { get; set; }

        [Required]
        public int EndPosition { get; set; }

        // Optional reference to specific part of submission
        public string ReferenceId { get; set; }

        // For code submissions, can reference line numbers
        public int? StartLine { get; set; }
        public int? EndLine { get; set; }

        // Metadata
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Optional attachment
        public FeedbackAttachment Attachment { get; set; }
    }

    public class FeedbackAttachment
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
        
        // Description of the attachment
        public string Description { get; set; }
    }
} 