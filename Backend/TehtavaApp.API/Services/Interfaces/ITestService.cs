using System.Collections.Generic;
using System.Threading.Tasks;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services
{
    public interface ITestService
    {
        Task<List<TestDTO>> GetTestsAsync(string userId);
        Task<TestDTO> GetTestAsync(string testId, string userId);
        Task<TestDTO> CreateTestAsync(CreateTestDTO testDto, string userId);
        Task<TestDTO> UpdateTestAsync(string testId, UpdateTestDTO testDto, string userId);
        Task<bool> DeleteTestAsync(string testId, string userId);
        
        Task<TestAttemptDTO> StartTestAttemptAsync(string testId, string userId);
        Task<TestAttemptDTO> GetTestAttemptAsync(string testId, string attemptId, string userId);
        Task<List<TestAttemptDTO>> GetUserTestAttemptsAsync(string testId, string userId);
        Task<TestAttemptDTO> SubmitTestAttemptAsync(string testId, string attemptId, SubmitTestDTO submitDto, string userId);
        Task<ApplicationUser> GetUserAsync(string userId);
    }
} 