using System.Collections.Generic;

namespace TehtavaApp.API.Models
{
    public class TestAnswer
    {
        public string Id { get; set; }
        
        public string TestAttemptId { get; set; }
        
        public virtual TestAttempt TestAttempt { get; set; }
        
        public string QuestionId { get; set; }
        
        public virtual TestQuestion Question { get; set; }
        
        public List<string> SelectedOptions { get; set; }
        
        public string TextAnswer { get; set; }
        
        public bool? IsCorrect { get; set; }
        
        public int? Points { get; set; }
    }
} 