using System.Threading.Tasks;
using TehtavaApp.API.DTOs;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface IAIGradingService
    {
        /// <summary>
        /// Grades a submission automatically using AI
        /// </summary>
        /// <param name="submissionId">The ID of the submission to grade</param>
        /// <param name="teacherId">Optional teacher ID for logging purposes</param>
        /// <returns>AI grading result with grade, feedback, and metadata</returns>
        Task<AIGradingResult> GradeSubmissionAsync(int submissionId, string? teacherId = null);

        /// <summary>
        /// Generates an AI grading suggestion without saving it
        /// </summary>
        /// <param name="submissionId">The ID of the submission to generate suggestions for</param>
        /// <returns>AI grading result as a suggestion</returns>
        Task<AIGradingResult> GenerateGradingSuggestionAsync(int submissionId);

        /// <summary>
        /// Tests the AI grading service connection
        /// </summary>
        /// <returns>True if connection is successful</returns>
        Task<bool> TestConnectionAsync();
    }
}

