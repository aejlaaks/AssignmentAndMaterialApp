using System;
using System.Collections.Generic;

namespace TehtavaApp.API.DTOs
{
    public class AIGradingResult
    {
        public double Grade { get; set; }
        public string Feedback { get; set; }
        public Dictionary<string, double> CriteriaScores { get; set; }
        public bool IsAIGenerated { get; set; }
        public double Confidence { get; set; }
        public string Provider { get; set; }
        public string Model { get; set; }
        public string Reasoning { get; set; }

        public AIGradingResult()
        {
            CriteriaScores = new Dictionary<string, double>();
            IsAIGenerated = true;
            Confidence = 0.0;
            Provider = string.Empty;
            Model = string.Empty;
            Feedback = string.Empty;
            Reasoning = string.Empty;
        }
    }

    public class AIGradingRequest
    {
        public int SubmissionId { get; set; }
        public bool UseRubric { get; set; }
        public string CustomInstructions { get; set; }

        public AIGradingRequest()
        {
            UseRubric = true;
            CustomInstructions = string.Empty;
        }
    }

    public class AIGradingMetadata
    {
        public string Provider { get; set; }
        public string Model { get; set; }
        public double Confidence { get; set; }
        public DateTime GradedAt { get; set; }
        public string Version { get; set; }

        public AIGradingMetadata()
        {
            Provider = string.Empty;
            Model = string.Empty;
            Confidence = 0.0;
            GradedAt = DateTime.UtcNow;
            Version = "1.0";
        }
    }

    public class AIGradingResponse
    {
        public double Grade { get; set; }
        public string Feedback { get; set; }
        public Dictionary<string, double> CriteriaScores { get; set; }
        public string Reasoning { get; set; }

        public AIGradingResponse()
        {
            CriteriaScores = new Dictionary<string, double>();
            Feedback = string.Empty;
            Reasoning = string.Empty;
        }
    }
}

