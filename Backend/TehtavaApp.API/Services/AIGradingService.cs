using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services
{
    public class AIGradingService : IAIGradingService
    {
        private readonly IAssignmentService _assignmentService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIGradingService> _logger;
        private readonly HttpClient _httpClient;
        private readonly AIGradingSettings _settings;
        private readonly IServiceProvider _serviceProvider;

        public AIGradingService(
            IAssignmentService assignmentService,
            IConfiguration configuration,
            ILogger<AIGradingService> logger,
            IHttpClientFactory httpClientFactory,
            IServiceProvider serviceProvider)
        {
            _assignmentService = assignmentService;
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _serviceProvider = serviceProvider;
            
            // Load AI grading settings from configuration
            _settings = new AIGradingSettings();
            _configuration.GetSection("AIGrading").Bind(_settings);
        }

        public async Task<AIGradingResult> GradeSubmissionAsync(int submissionId, string? teacherId = null)
        {
            try
            {
                if (!_settings.Enabled)
                {
                    throw new InvalidOperationException("AI grading is not enabled in the system settings.");
                }

                _logger.LogInformation($"Starting AI grading for submission {submissionId}");
                return await GenerateGradingSuggestionAsync(submissionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error grading submission {submissionId} with AI");
                throw;
            }
        }

        public async Task<AIGradingResult> GenerateGradingSuggestionAsync(int submissionId)
        {
            try
            {
                if (!_settings.Enabled)
                {
                    throw new InvalidOperationException("AI grading is not enabled in the system settings.");
                }

                // Get submission with related data
                var submission = await _assignmentService.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    throw new ArgumentException($"Submission with ID {submissionId} not found.");
                }

                // Get assignment
                var assignment = await _assignmentService.GetAssignmentByIdAsync(submission.AssignmentId);
                if (assignment == null)
                {
                    throw new ArgumentException($"Assignment with ID {submission.AssignmentId} not found.");
                }

                // Try to get rubric (optional) - only if RubricService is available
                Backend.Models.Rubric rubric = null;
                try
                {
                    var rubricService = _serviceProvider.GetService<Backend.Services.IRubricService>();
                    if (rubricService != null)
                    {
                        rubric = await rubricService.GetRubricByAssignmentAsync(assignment.Id.ToString());
                    }
                    else
                    {
                        _logger.LogInformation($"RubricService not available, skipping rubric for assignment {assignment.Id}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Could not retrieve rubric for assignment {assignment.Id}");
                }

                // Build the prompt
                var prompt = BuildGradingPrompt(assignment, submission, rubric);

                // Call AI service based on provider
                AIGradingResponse aiResponse;
                if (_settings.Provider == AIGradingProvider.OpenAI)
                {
                    aiResponse = await CallOpenAIAsync(prompt);
                }
                else if (_settings.Provider == AIGradingProvider.AzureOpenAI)
                {
                    aiResponse = await CallAzureOpenAIAsync(prompt);
                }
                else
                {
                    throw new NotSupportedException($"AI provider {_settings.Provider} is not supported.");
                }

                // Create result
                var result = new AIGradingResult
                {
                    Grade = aiResponse.Grade,
                    Feedback = aiResponse.Feedback,
                    CriteriaScores = aiResponse.CriteriaScores,
                    IsAIGenerated = true,
                    Confidence = CalculateConfidence(aiResponse),
                    Provider = _settings.Provider.ToString(),
                    Model = _settings.Provider == AIGradingProvider.OpenAI 
                        ? _settings.OpenAI.Model 
                        : _settings.AzureOpenAI.DeploymentName,
                    Reasoning = aiResponse.Reasoning
                };

                _logger.LogInformation($"Successfully generated AI grading for submission {submissionId}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating AI grading suggestion for submission {submissionId}");
                throw;
            }
        }

        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                if (!_settings.Enabled)
                {
                    return false;
                }

                var testPrompt = "Test connection. Respond with OK.";
                
                if (_settings.Provider == AIGradingProvider.OpenAI)
                {
                    await CallOpenAIAsync(testPrompt);
                }
                else if (_settings.Provider == AIGradingProvider.AzureOpenAI)
                {
                    await CallAzureOpenAIAsync(testPrompt);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI connection test failed");
                return false;
            }
        }

        private string BuildGradingPrompt(Assignment assignment, AssignmentSubmission submission, Backend.Models.Rubric? rubric)
        {
            var promptBuilder = new StringBuilder();
            
            promptBuilder.AppendLine("Arvioi seuraava tehtäväpalautus suomen kielellä.");
            promptBuilder.AppendLine();
            
            promptBuilder.AppendLine("TEHTÄVÄNANTO:");
            promptBuilder.AppendLine($"Otsikko: {assignment.Title}");
            promptBuilder.AppendLine($"Kuvaus: {assignment.Description}");
            if (!string.IsNullOrEmpty(assignment.ContentMarkdown))
            {
                promptBuilder.AppendLine($"Sisältö: {assignment.ContentMarkdown}");
            }
            promptBuilder.AppendLine();

            if (rubric != null && rubric.Criteria.Any())
            {
                promptBuilder.AppendLine("ARVIOINTIPERUSTEET (RUBRIC):");
                promptBuilder.AppendLine($"Otsikko: {rubric.Title}");
                promptBuilder.AppendLine($"Kuvaus: {rubric.Description}");
                promptBuilder.AppendLine();
                
                foreach (var criterion in rubric.Criteria)
                {
                    promptBuilder.AppendLine($"Kriteeri: {criterion.Title}");
                    promptBuilder.AppendLine($"Kuvaus: {criterion.Description}");
                    promptBuilder.AppendLine($"Paino: {criterion.Weight}");
                    promptBuilder.AppendLine("Tasot:");
                    
                    foreach (var level in criterion.Levels.OrderByDescending(l => l.Points))
                    {
                        promptBuilder.AppendLine($"  - {level.Title} ({level.Points} pistettä): {level.Description}");
                    }
                    promptBuilder.AppendLine();
                }
            }
            else if (assignment.MaxPoints.HasValue)
            {
                promptBuilder.AppendLine($"MAKSIMIPISTEET: {assignment.MaxPoints.Value}");
                promptBuilder.AppendLine();
            }

            promptBuilder.AppendLine("OPISKELIJAN VASTAUS:");
            promptBuilder.AppendLine(submission.SubmissionText);
            promptBuilder.AppendLine();

            promptBuilder.AppendLine("Anna arviointi seuraavassa JSON-muodossa:");
            promptBuilder.AppendLine("{");
            promptBuilder.AppendLine("  \"grade\": <numero 0-5 välillä>,");
            promptBuilder.AppendLine("  \"feedback\": \"<rakentava palaute suomeksi>\",");
            
            if (rubric != null && rubric.Criteria.Any())
            {
                promptBuilder.AppendLine("  \"criteriaScores\": {");
                promptBuilder.AppendLine("    \"<kriteeri-id>\": <pisteet>,");
                promptBuilder.AppendLine("    ...");
                promptBuilder.AppendLine("  },");
            }
            
            promptBuilder.AppendLine("  \"reasoning\": \"<lyhyt perustelu arvosanalle>\"");
            promptBuilder.AppendLine("}");
            promptBuilder.AppendLine();
            promptBuilder.AppendLine("Varmista, että:");
            promptBuilder.AppendLine("- Arvosana on välillä 0-5 (suomalainen arvosteluasteikko)");
            promptBuilder.AppendLine("- Palaute on rakentavaa ja auttaa opiskelijaa kehittymään");
            promptBuilder.AppendLine("- Vastaus on validia JSON-muotoa");

            return promptBuilder.ToString();
        }

        private async Task<AIGradingResponse> CallOpenAIAsync(string prompt)
        {
            try
            {
                if (string.IsNullOrEmpty(_settings.OpenAI.ApiKey))
                {
                    throw new InvalidOperationException("OpenAI API key is not configured.");
                }

                var requestBody = new
                {
                    model = _settings.OpenAI.Model,
                    messages = new[]
                    {
                        new { role = "system", content = "Olet opettajan avustaja, joka arvioi opiskelijoiden tehtäväpalautuksia. Anna aina vastaus JSON-muodossa." },
                        new { role = "user", content = prompt }
                    },
                    max_tokens = _settings.OpenAI.MaxTokens,
                    temperature = 0.3,
                    response_format = new { type = "json_object" }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        Encoding.UTF8,
                        "application/json")
                };

                request.Headers.Add("Authorization", $"Bearer {_settings.OpenAI.ApiKey}");

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonResponse = JsonDocument.Parse(responseContent);
                
                var messageContent = jsonResponse.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return ParseAIResponse(messageContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling OpenAI API");
                throw;
            }
        }

        private async Task<AIGradingResponse> CallAzureOpenAIAsync(string prompt)
        {
            try
            {
                if (string.IsNullOrEmpty(_settings.AzureOpenAI.ApiKey) || 
                    string.IsNullOrEmpty(_settings.AzureOpenAI.Endpoint))
                {
                    throw new InvalidOperationException("Azure OpenAI configuration is incomplete.");
                }

                var endpoint = _settings.AzureOpenAI.Endpoint.TrimEnd('/');
                var deploymentName = _settings.AzureOpenAI.DeploymentName;
                var apiVersion = _settings.AzureOpenAI.ApiVersion;
                var url = $"{endpoint}/openai/deployments/{deploymentName}/chat/completions?api-version={apiVersion}";

                var requestBody = new
                {
                    messages = new[]
                    {
                        new { role = "system", content = "Olet opettajan avustaja, joka arvioi opiskelijoiden tehtäväpalautuksia. Anna aina vastaus JSON-muodossa." },
                        new { role = "user", content = prompt }
                    },
                    max_tokens = _settings.OpenAI.MaxTokens,
                    temperature = 0.3,
                    response_format = new { type = "json_object" }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        Encoding.UTF8,
                        "application/json")
                };

                request.Headers.Add("api-key", _settings.AzureOpenAI.ApiKey);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonResponse = JsonDocument.Parse(responseContent);
                
                var messageContent = jsonResponse.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return ParseAIResponse(messageContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Azure OpenAI API");
                throw;
            }
        }

        private AIGradingResponse ParseAIResponse(string jsonContent)
        {
            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var response = JsonSerializer.Deserialize<AIGradingResponse>(jsonContent, options);
                
                if (response == null)
                {
                    throw new InvalidOperationException("Failed to parse AI response.");
                }

                // Validate grade is in correct range
                if (response.Grade < 0 || response.Grade > 5)
                {
                    _logger.LogWarning($"AI returned grade {response.Grade} outside of 0-5 range, clamping.");
                    response.Grade = Math.Max(0, Math.Min(5, response.Grade));
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error parsing AI response: {jsonContent}");
                throw;
            }
        }

        private double CalculateConfidence(AIGradingResponse response)
        {
            // Simple confidence calculation based on response quality
            double confidence = 0.5; // Base confidence

            // Increase confidence if feedback is substantial
            if (!string.IsNullOrEmpty(response.Feedback) && response.Feedback.Length > 50)
            {
                confidence += 0.2;
            }

            // Increase confidence if reasoning is provided
            if (!string.IsNullOrEmpty(response.Reasoning) && response.Reasoning.Length > 20)
            {
                confidence += 0.2;
            }

            // Increase confidence if criteria scores are provided
            if (response.CriteriaScores != null && response.CriteriaScores.Any())
            {
                confidence += 0.1;
            }

            return Math.Min(1.0, confidence);
        }
    }
}

