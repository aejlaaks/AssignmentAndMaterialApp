using System;

namespace TehtavaApp.API.Models
{
    public enum AIGradingProvider
    {
        OpenAI,
        AzureOpenAI
    }

    public enum AIGradingMode
    {
        Automatic,
        Assisted
    }

    public class AIGradingSettings
    {
        public bool Enabled { get; set; }
        public AIGradingProvider Provider { get; set; }
        public AIGradingMode Mode { get; set; }
        public bool MarkAsAIGenerated { get; set; }
        public OpenAISettings OpenAI { get; set; }
        public AzureOpenAISettings AzureOpenAI { get; set; }

        public AIGradingSettings()
        {
            Enabled = false;
            Provider = AIGradingProvider.OpenAI;
            Mode = AIGradingMode.Assisted;
            MarkAsAIGenerated = true;
            OpenAI = new OpenAISettings();
            AzureOpenAI = new AzureOpenAISettings();
        }
    }

    public class OpenAISettings
    {
        public string ApiKey { get; set; }
        public string Model { get; set; }
        public int MaxTokens { get; set; }

        public OpenAISettings()
        {
            Model = "gpt-4o";
            MaxTokens = 2000;
            ApiKey = string.Empty;
        }
    }

    public class AzureOpenAISettings
    {
        public string Endpoint { get; set; }
        public string ApiKey { get; set; }
        public string DeploymentName { get; set; }
        public string ApiVersion { get; set; }

        public AzureOpenAISettings()
        {
            Endpoint = string.Empty;
            ApiKey = string.Empty;
            DeploymentName = string.Empty;
            ApiVersion = "2024-02-15-preview";
        }
    }
}

