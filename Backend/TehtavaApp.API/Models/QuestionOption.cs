using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models
{
    public class QuestionOption
    {
        public string Id { get; set; }
        
        [Required]
        public string Text { get; set; }
        
        public bool IsCorrect { get; set; }
        
        public string QuestionId { get; set; }
        
        public virtual Question Question { get; set; }
    }
} 