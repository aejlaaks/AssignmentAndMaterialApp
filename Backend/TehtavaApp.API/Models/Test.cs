using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models
{
    public class Test
    {
        public string Id { get; set; }
        
        [Required]
        public string Title { get; set; }
        
        public string Description { get; set; }
        
        public bool Proctored { get; set; }
        
        public string ShowResults { get; set; }  // immediately, after_due_date, manual
        
        [Required]
        public int TimeLimit { get; set; }  // in minutes
        
        [Required]
        public int PassingScore { get; set; }
        
        [Required]
        public int Attempts { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        public string AllowedResources { get; set; }  // JSON string array
        
        public bool IsVisible { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime UpdatedAt { get; set; }
        
        public string CreatedById { get; set; }
        
        public string UpdatedById { get; set; }
        
        public virtual ApplicationUser CreatedBy { get; set; }
        
        public virtual ICollection<TestQuestion> Questions { get; set; }
        
        public virtual ICollection<TestAttempt> TestAttempts { get; set; }
    }
} 