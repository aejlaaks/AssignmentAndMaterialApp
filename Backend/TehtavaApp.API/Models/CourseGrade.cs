using System;

namespace TehtavaApp.API.Models
{
    public enum GradingType
    {
        Numeric = 0,  // Default 1-5 scale
        PassFail = 1  // Pass/Fail grading
    }

    public class CourseGrade
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string StudentId { get; set; }
        public double Grade { get; set; }
        public string GradedById { get; set; }
        public DateTime GradedAt { get; set; }
        public string Feedback { get; set; }
        public bool IsFinal { get; set; }
        public GradingType GradingType { get; set; }
        
        // Navigation properties
        public Course Course { get; set; }
        public ApplicationUser Student { get; set; }
        public ApplicationUser GradedBy { get; set; }
        
        public CourseGrade()
        {
            GradedAt = DateTime.UtcNow;
            IsFinal = false;
            GradingType = GradingType.Numeric; // Default to numeric grading
        }

        // Helper property to check if the student passed the course
        public bool Passed => GradingType == GradingType.PassFail ? Grade > 0 : Grade > 0.5;
    }
} 