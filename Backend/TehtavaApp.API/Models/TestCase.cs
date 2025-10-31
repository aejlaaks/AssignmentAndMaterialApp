using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models
{
    public class TestCase
    {
        public string Id { get; set; }
        
        [Required]
        public string Input { get; set; }
        
        [Required]
        public string ExpectedOutput { get; set; }
        
        public bool IsHidden { get; set; }
        
        public string QuestionId { get; set; }
        
        public virtual Question Question { get; set; }
    }
} 