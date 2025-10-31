using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models
{
    public enum QuestionType
    {
        MultipleChoice,
        MultipleSelect,
        TrueFalse,
        ShortAnswer,
        Essay,
        Matching,
        Code
    }

    public class Question
    {
        public string Id { get; set; }
        
        [Required]
        public string Text { get; set; }
        
        [Required]
        public QuestionType Type { get; set; }
        
        public int Points { get; set; }
        
        public int Order { get; set; }
        
        public string Explanation { get; set; }
        
        
        // Test relationship
        public string? TestId { get; set; }
        public virtual Test? Test { get; set; }
        
        public virtual ICollection<QuestionOption> Options { get; set; }
        
        public virtual ICollection<TestCase> TestCases { get; set; }
        
        public string CodeTemplate { get; set; }
        
        public string CodeLanguage { get; set; }
        
        public string CorrectAnswer { get; set; }  // JSON string for multiple answers
    }
} 