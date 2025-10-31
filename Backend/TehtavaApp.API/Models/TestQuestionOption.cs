using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models
{
    public class TestQuestionOption
    {
        public string Id { get; set; }
        
        [Required]
        public string Text { get; set; }
        
        [Required]
        public bool IsCorrect { get; set; }
        
        public string QuestionId { get; set; }
        
        public virtual TestQuestion Question { get; set; }
    }
} 