using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Data;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using Newtonsoft.Json;
using System.Text.Json;

namespace TehtavaApp.API.Services
{
    public class TestService : ITestService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TestService> _logger;

        public TestService(
            ApplicationDbContext context,
            ILogger<TestService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<TestDTO>> GetTestsAsync(string userId)
        {
            // For a basic implementation, return all tests - you might want to add filtering based on user role later
            try
            {
                // Get user to determine role-based access
                var user = await _context.Users.FindAsync(userId);
                
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found when retrieving tests", userId);
                    return new List<TestDTO>();
                }

                // TODO: Add more sophisticated filtering based on roles and course access
                var tests = await _context.Tests
                    .Include(t => t.Questions)
                    .ToListAsync();

                return tests.Select(MapTestToDTO).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tests for user {UserId}", userId);
                throw;
            }
        }

        public async Task<TestDTO> GetTestAsync(string testId, string userId)
        {
            try
            {
                var test = await _context.Tests
                    .Include(t => t.Questions)
                    .ThenInclude(q => q.Options)
                    .FirstOrDefaultAsync(t => t.Id == testId);

                if (test == null)
                {
                    _logger.LogWarning("Test {TestId} not found", testId);
                    return null;
                }

                // TODO: Check user permissions for accessing this test

                return MapTestToDTO(test);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving test {TestId} for user {UserId}", testId, userId);
                throw;
            }
        }

        public async Task<TestDTO> CreateTestAsync(CreateTestDTO testDto, string userId)
        {
            try
            {
                _logger.LogInformation("Creating test with data: {TestData}", JsonConvert.SerializeObject(testDto));
                
                // Create a new test from the DTO
                var test = new Test
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = testDto.Title,
                    Description = testDto.Description,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsVisible = testDto.IsVisible,
                    Proctored = testDto.Proctored,
                    ShowResults = testDto.ShowResults,
                    TimeLimit = testDto.TimeLimit,
                    PassingScore = testDto.PassingScore,
                    Attempts = testDto.Attempts,
                    // Ensure AllowedResources is a valid JSON string, not null
                    AllowedResources = testDto.AllowedResources != null ? 
                        (testDto.AllowedResources.Count == 0 ? "[]" : JsonConvert.SerializeObject(testDto.AllowedResources)) : 
                        "[]",
                    DueDate = testDto.DueDate
                };

                // Add questions if provided
                if (testDto.Questions != null && testDto.Questions.Any())
                {
                    // Create a list to store the created questions
                    var questionsList = new List<TestQuestion>();
                    
                    // Process each question
                    foreach (var q in testDto.Questions)
                    {
                        // Create a new TestQuestion with a real GUID
                        var questionId = Guid.NewGuid().ToString();
                        var question = new TestQuestion
                        {
                            Id = questionId,
                            Text = q.Text,
                            Type = q.Type,
                            Points = q.Points,
                            Order = q.Order > 0 ? q.Order : questionsList.Count + 1,
                            // Ensure required fields are never null
                            CodeLanguage = !string.IsNullOrEmpty(q.CodeLanguage) ? q.CodeLanguage : "none",
                            CodeTemplate = q.CodeTemplate ?? string.Empty,
                            Explanation = q.Explanation ?? string.Empty,
                            Options = new List<TestQuestionOption>(),
                            TestId = test.Id
                        };
                        
                        // Add options if applicable
                        if (q.Options != null && q.Options.Any())
                        {
                            foreach (var o in q.Options)
                            {
                                var option = new TestQuestionOption
                                {
                                    Id = Guid.NewGuid().ToString(),
                                    Text = o.Text,
                                    IsCorrect = o.IsCorrect,
                                    QuestionId = questionId // Use the real question ID
                                };
                                question.Options.Add(option);
                            }
                        }
                        
                        questionsList.Add(question);
                    }
                    
                    test.Questions = questionsList;
                }
                else
                {
                    test.Questions = new List<TestQuestion>();
                }

                _logger.LogInformation("Adding test to database: {TestId}", test.Id);
                _context.Tests.Add(test);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Test successfully created: {TestId}", test.Id);

                return MapTestToDTO(test);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating test for user {UserId}", userId);
                throw;
            }
        }

        public async Task<TestDTO> UpdateTestAsync(string testId, UpdateTestDTO testDto, string userId)
        {
            try
            {
                var test = await _context.Tests
                    .Include(t => t.Questions)
                    .ThenInclude(q => q.Options)
                    .FirstOrDefaultAsync(t => t.Id == testId);

                if (test == null)
                {
                    _logger.LogWarning("Test {TestId} not found for update", testId);
                    return null;
                }

                // Update test properties
                test.Title = testDto.Title;
                test.Description = testDto.Description;
                test.IsVisible = testDto.IsVisible;
                test.Proctored = testDto.Proctored;
                test.ShowResults = testDto.ShowResults;
                test.TimeLimit = testDto.TimeLimit;
                test.PassingScore = testDto.PassingScore;
                test.UpdatedById = userId;
                test.UpdatedAt = DateTime.UtcNow;
                // Update other properties

                // Update questions (this is a simplified approach - a more complete solution would handle
                // adding/updating/removing questions in a more sophisticated way)
                if (testDto.Questions != null)
                {
                    // Remove existing questions
                    _context.TestQuestions.RemoveRange(test.Questions);
                    
                    // Add new questions
                    test.Questions = testDto.Questions.Select((q, index) => new TestQuestion
                    {
                        Id = q.Id ?? Guid.NewGuid().ToString(),
                        Text = q.Text,
                        Type = q.Type,
                        Points = q.Points,
                        Order = q.Order > 0 ? q.Order : index + 1,
                        // Add options if applicable
                        Options = q.Options?.Select(o => new TestQuestionOption
                        {
                            Id = Guid.NewGuid().ToString(),
                            Text = o.Text,
                            IsCorrect = o.IsCorrect
                        }).ToList() ?? new List<TestQuestionOption>()
                    }).ToList();
                }

                await _context.SaveChangesAsync();
                return MapTestToDTO(test);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating test {TestId} for user {UserId}", testId, userId);
                throw;
            }
        }

        public async Task<bool> DeleteTestAsync(string testId, string userId)
        {
            try
            {
                var test = await _context.Tests.FindAsync(testId);

                if (test == null)
                {
                    _logger.LogWarning("Test {TestId} not found for deletion", testId);
                    return false;
                }

                // TODO: Check user permissions for deleting this test

                _context.Tests.Remove(test);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting test {TestId} for user {UserId}", testId, userId);
                throw;
            }
        }

        public async Task<TestAttemptDTO> StartTestAttemptAsync(string testId, string userId)
        {
            try
            {
                var test = await _context.Tests
                    .Include(t => t.Questions)
                    .FirstOrDefaultAsync(t => t.Id == testId);

                if (test == null)
                {
                    _logger.LogWarning("Test {TestId} not found when starting attempt", testId);
                    return null;
                }

                // Create a new attempt
                var attempt = new TestAttempt
                {
                    Id = Guid.NewGuid().ToString(),
                    TestId = testId,
                    UserId = userId,
                    StartTime = DateTime.UtcNow,
                    Answers = new List<TestAnswer>()
                };

                _context.TestAttempts.Add(attempt);
                await _context.SaveChangesAsync();

                return MapTestAttemptToDTO(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting test attempt for test {TestId} and user {UserId}", testId, userId);
                throw;
            }
        }

        public async Task<TestAttemptDTO> GetTestAttemptAsync(string testId, string attemptId, string userId)
        {
            try
            {
                var attempt = await _context.TestAttempts
                    .Include(a => a.Answers)
                    .FirstOrDefaultAsync(a => a.Id == attemptId && a.TestId == testId);

                if (attempt == null || attempt.UserId != userId)
                {
                    _logger.LogWarning("Test attempt {AttemptId} not found for test {TestId} and user {UserId}", 
                        attemptId, testId, userId);
                    return null;
                }

                return MapTestAttemptToDTO(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving test attempt {AttemptId} for test {TestId} and user {UserId}", 
                    attemptId, testId, userId);
                throw;
            }
        }

        public async Task<List<TestAttemptDTO>> GetUserTestAttemptsAsync(string testId, string userId)
        {
            try
            {
                var attempts = await _context.TestAttempts
                    .Include(a => a.Answers)
                    .Where(a => a.TestId == testId && a.UserId == userId)
                    .ToListAsync();

                return attempts.Select(MapTestAttemptToDTO).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving test attempts for test {TestId} and user {UserId}", 
                    testId, userId);
                throw;
            }
        }

        public async Task<TestAttemptDTO> SubmitTestAttemptAsync(string testId, string attemptId, SubmitTestDTO submitDto, string userId)
        {
            try
            {
                var attempt = await _context.TestAttempts
                    .Include(a => a.Answers)
                    .FirstOrDefaultAsync(a => a.Id == attemptId && a.TestId == testId && a.UserId == userId);

                if (attempt == null)
                {
                    _logger.LogWarning("Test attempt {AttemptId} not found for test {TestId} and user {UserId} during submission", 
                        attemptId, testId, userId);
                    return null;
                }

                // End the attempt
                attempt.EndTime = DateTime.UtcNow;
                
                // Clear existing answers and add new ones
                _context.TestAnswers.RemoveRange(attempt.Answers);
                attempt.Answers = new List<TestAnswer>();

                // Get the test to grade the answers
                var test = await _context.Tests
                    .Include(t => t.Questions)
                    .ThenInclude(q => q.Options)
                    .FirstOrDefaultAsync(t => t.Id == testId);

                if (test == null)
                {
                    _logger.LogWarning("Test {TestId} not found during attempt submission", testId);
                    return null;
                }

                // Process and grade submitted answers
                var totalPoints = 0;
                var earnedPoints = 0;

                foreach (var answerDto in submitDto.Answers)
                {
                    var question = test.Questions.FirstOrDefault(q => q.Id == answerDto.QuestionId);
                    if (question == null) continue;

                    if (question.Points > 0)
                    {
                        totalPoints += question.Points;
                    }
                    
                    var answer = new TestAnswer
                    {
                        Id = Guid.NewGuid().ToString(),
                        TestAttemptId = attemptId,
                        QuestionId = answerDto.QuestionId
                    };

                    // Handle different question types
                    switch (question.Type)
                    {
                        case "MultipleChoice":
                        case "MultipleSelect":
                            answer.SelectedOptions = answerDto.SelectedOptions;
                            
                            // Check if the answer is correct
                            var correctOptionIds = question.Options
                                .Where(o => o.IsCorrect)
                                .Select(o => o.Id)
                                .ToList();
                            
                            if (answerDto.SelectedOptions != null)
                            {
                                var selectedOptions = answerDto.SelectedOptions.ToList();
                                
                                // For MultipleChoice, the answer is correct if the user selected exactly one option
                                // and it's the correct one
                                if (question.Type == "MultipleChoice")
                                {
                                    answer.IsCorrect = selectedOptions.Count == 1 && 
                                                      correctOptionIds.Contains(selectedOptions[0]);
                                }
                                // For MultipleSelect, the answer is correct if the user selected all correct options
                                // and only the correct options
                                else
                                {
                                    var allCorrectSelected = correctOptionIds.All(id => selectedOptions.Contains(id));
                                    var onlyCorrectSelected = selectedOptions.All(id => correctOptionIds.Contains(id));
                                    answer.IsCorrect = allCorrectSelected && onlyCorrectSelected;
                                }
                                
                                // Award points based on correctness
                                answer.Points = answer.IsCorrect == true ? question.Points : 0;
                                earnedPoints += answer.Points ?? 0;
                            }
                            break;
                            
                        case "ShortAnswer":
                        case "Essay":
                            answer.TextAnswer = answerDto.TextAnswer;
                            // These typically require manual grading
                            answer.IsCorrect = null;
                            answer.Points = null;
                            break;
                            
                        // Add cases for other question types
                    }

                    attempt.Answers.Add(answer);
                }

                // Calculate score if all answers are auto-graded
                if (!attempt.Answers.Any(a => a.IsCorrect == null))
                {
                    attempt.Score = totalPoints > 0 ? (decimal)earnedPoints / totalPoints * 100 : 0;
                    // Determine if the student passed based on the test's passing score
                    if (test.PassingScore > 0)
                    {
                        attempt.IsPassed = attempt.Score >= test.PassingScore;
                    }
                }

                await _context.SaveChangesAsync();
                return MapTestAttemptToDTO(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting test attempt {AttemptId} for test {TestId} and user {UserId}", 
                    attemptId, testId, userId);
                throw;
            }
        }

        // Add this method to support user retrieval for authentication verification
        public async Task<ApplicationUser> GetUserAsync(string userId)
        {
            try
            {
                return await _context.Users.FindAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user {UserId}", userId);
                return null;
            }
        }

        // Helper methods to map entities to DTOs
        private TestDTO MapTestToDTO(Test test)
        {
            return new TestDTO
            {
                Id = test.Id,
                Title = test.Title,
                Description = test.Description,
                Proctored = test.Proctored,
                ShowResults = test.ShowResults,
                TimeLimit = test.TimeLimit,
                PassingScore = test.PassingScore,
                Attempts = test.Attempts,
                DueDate = test.DueDate,
                AllowedResources = test.AllowedResources != null ? 
                    JsonConvert.DeserializeObject<List<string>>(test.AllowedResources) : 
                    new List<string>(),
                CreatedAt = test.CreatedAt,
                UpdatedAt = test.UpdatedAt,
                CreatedById = test.CreatedById,
                IsVisible = test.IsVisible,
                CreatedByName = test.CreatedBy?.FirstName + " " + test.CreatedBy?.LastName,
                Questions = test.Questions.Select(q => new TestQuestionDTO
                {
                    Id = q.Id,
                    Text = q.Text,
                    Type = q.Type,
                    Points = q.Points,
                    Order = q.Order,
                    Explanation = q.Explanation,
                    CodeTemplate = q.CodeTemplate,
                    CodeLanguage = q.CodeLanguage,
                    Options = q.Options?.Select(o => new TestQuestionOptionDTO
                    {
                        Id = o.Id,
                        Text = o.Text,
                        IsCorrect = o.IsCorrect
                    }).ToList()
                }).OrderBy(q => q.Order).ToList()
            };
        }

        private TestAttemptDTO MapTestAttemptToDTO(TestAttempt attempt)
        {
            return new TestAttemptDTO
            {
                Id = attempt.Id,
                TestId = attempt.TestId,
                UserId = attempt.UserId,
                StartTime = attempt.StartTime.ToString("o"),
                EndTime = attempt.EndTime?.ToString("o"),
                Score = attempt.Score,
                IsPassed = attempt.IsPassed,
                Status = attempt.Status,
                Answers = attempt.Answers?.Select(a => new TestAnswerDTO
                {
                    Id = a.Id,
                    QuestionId = a.QuestionId,
                    SelectedOptions = a.SelectedOptions,
                    TextAnswer = a.TextAnswer,
                    IsCorrect = a.IsCorrect,
                    Points = a.Points
                }).ToList() ?? new List<TestAnswerDTO>()
            };
        }
    }
} 