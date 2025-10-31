using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class RubricGradeDTO
    {
        [Required]
        public string SubmissionId { get; set; }

        [Required]
        public List<CriterionGradeDTO> CriteriaGrades { get; set; }

        public string OverallFeedback { get; set; }

        public double TotalScore { get; set; }
    }

    public class CriterionGradeDTO
    {
        [Required]
        public string CriterionId { get; set; }

        [Required]
        public string LevelId { get; set; }

        [Required]
        public double Points { get; set; }

        public string Feedback { get; set; }
    }
} 