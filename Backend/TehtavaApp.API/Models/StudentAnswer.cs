using System;

namespace TehtavaApp.API.Models
{
    public class StudentAnswer
    {
        public string Id { get; set; }
        
        // Quiz attempt relationship
        
        // Test attempt relationship
        public string? TestAttemptId { get; set; }
        public virtual TestAttempt? TestAttempt { get; set; }
        
        public string QuestionId { get; set; }
        
        public virtual Question Question { get; set; }
        
        public string Answer { get; set; }  // JSON string for multiple answers
        
        public int? Points { get; set; }
        
        public string Feedback { get; set; }
        
        public int? TimeSpent { get; set; }  // Time spent on this question in seconds
    }
} 