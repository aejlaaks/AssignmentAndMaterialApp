using System;
using System.Collections.Generic;

namespace TehtavaApp.API.Models
{
    public class TestAttempt
    {
        public string Id { get; set; }
        
        public string TestId { get; set; }
        
        public virtual Test Test { get; set; }
        
        public string UserId { get; set; }
        
        public virtual ApplicationUser Student { get; set; }
        
        public DateTime StartTime { get; set; }
        
        public DateTime? EndTime { get; set; }
        
        public decimal? Score { get; set; }
        
        public bool? IsPassed { get; set; }
        
        public string Status { get; set; }  // in_progress, submitted, graded
        
        public bool IsProctored { get; set; }
        
        public string ProctorNotes { get; set; }
        
        public virtual ICollection<TestAnswer> Answers { get; set; }
    }
} 