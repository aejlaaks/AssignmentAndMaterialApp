using System;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    public class GradingHistory
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SubmissionId { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssignmentId { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string StudentId { get; set; }

        public string StudentName { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string TeacherId { get; set; }

        public string TeacherName { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string CourseId { get; set; }

        public string CourseName { get; set; }

        public string AssignmentTitle { get; set; }

        public double? Grade { get; set; }

        public string Feedback { get; set; }

        public bool RequiresRevision { get; set; }

        public DateTime? RevisionDueDate { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string Action { get; set; } // e.g., "graded", "returned", "reverted"

        // For rubric grading
        [BsonRepresentation(BsonType.ObjectId)]
        public string RubricId { get; set; }

        public RubricGradeData RubricGrade { get; set; }

        // Previous version for reverting
        [BsonRepresentation(BsonType.ObjectId)]
        public string PreviousVersionId { get; set; }
    }

    public class RubricGradeData
    {
        public double TotalScore { get; set; }
        public string OverallFeedback { get; set; }
        public RubricCriterionGrade[] CriteriaGrades { get; set; }
    }

    public class RubricCriterionGrade
    {
        [BsonRepresentation(BsonType.ObjectId)]
        public string CriterionId { get; set; }
        
        [BsonRepresentation(BsonType.ObjectId)]
        public string LevelId { get; set; }
        
        public double Points { get; set; }
        
        public string Feedback { get; set; }
    }
} 