using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models
{
    public class TestQuestion
    {
        public string Id { get; set; }
        
        [Required]
        public string Text { get; set; }
        
        [Required]
        public string Type { get; set; }  // MultipleChoice, MultipleSelect, TrueFalse, ShortAnswer, Essay
        
        [Required]
        public int Points { get; set; }
        
        [Required]
        public int Order { get; set; }
        
        public string Explanation { get; set; }
        
        public string CodeTemplate { get; set; }
        
        public string CodeLanguage { get; set; }
        
        public string TestId { get; set; }
        
        public virtual Test Test { get; set; }
        
        public virtual ICollection<TestQuestionOption> Options { get; set; }
    }
} 