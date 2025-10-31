using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Services;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : BaseController
    {
        private readonly ITestService _testService;
        private readonly ILogger<TestController> _logger;

        public TestController(
            ITestService testService,
            ILogger<TestController> logger)
        {
            _testService = testService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<TestDTO>>> GetTests()
        {
            try
            {
                var userId = UserId;
                var tests = await _testService.GetTestsAsync(userId);
                return Ok(tests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tests");
                return StatusCode(500, "An error occurred while retrieving tests");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TestDTO>> GetTest(string id)
        {
            try
            {
                var userId = UserId;
                var test = await _testService.GetTestAsync(id, userId);
                
                if (test == null)
                {
                    return NotFound($"Test with ID {id} not found");
                }
                
                return Ok(test);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test {TestId}", id);
                return StatusCode(500, "An error occurred while retrieving the test");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TestDTO>> CreateTest(CreateTestDTO testDto)
        {
            try
            {
                _logger.LogInformation("Creating test with user {UserId}", UserId);
                Console.WriteLine($"Creating test with user ID: {UserId}");
                
                if (string.IsNullOrEmpty(UserId))
                {
                    _logger.LogWarning("User ID is null or empty in CreateTest");
                    Console.WriteLine("User ID is null or empty in CreateTest");
                    return Unauthorized("User is not authenticated properly");
                }
                
                var user = await _testService.GetUserAsync(UserId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for ID {UserId}", UserId);
                    Console.WriteLine($"User not found for ID {UserId}");
                    return NotFound($"User with ID {UserId} not found");
                }
                
                var test = await _testService.CreateTestAsync(testDto, UserId);
                return CreatedAtAction(nameof(GetTest), new { id = test.Id }, test);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating test with user {UserId}", UserId);
                Console.WriteLine($"Error creating test: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, "An error occurred while creating the test");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TestDTO>> UpdateTest(string id, UpdateTestDTO testDto)
        {
            try
            {
                var userId = UserId;
                var test = await _testService.UpdateTestAsync(id, testDto, userId);
                
                if (test == null)
                {
                    return NotFound($"Test with ID {id} not found");
                }
                
                return Ok(test);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating test {TestId}", id);
                return StatusCode(500, "An error occurred while updating the test");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTest(string id)
        {
            try
            {
                var userId = UserId;
                var success = await _testService.DeleteTestAsync(id, userId);
                
                if (!success)
                {
                    return NotFound($"Test with ID {id} not found");
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting test {TestId}", id);
                return StatusCode(500, "An error occurred while deleting the test");
            }
        }

        [HttpGet("{testId}/attempts/my")]
        public async Task<ActionResult<List<TestAttemptDTO>>> GetMyTestAttempts(string testId)
        {
            try
            {
                var userId = UserId;
                var attempts = await _testService.GetUserTestAttemptsAsync(testId, userId);
                return Ok(attempts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test attempts for test {TestId}", testId);
                return StatusCode(500, "An error occurred while retrieving test attempts");
            }
        }

        [HttpPost("{testId}/attempts")]
        public async Task<ActionResult<TestAttemptDTO>> StartTestAttempt(string testId)
        {
            try
            {
                var userId = UserId;
                var attempt = await _testService.StartTestAttemptAsync(testId, userId);
                return CreatedAtAction(nameof(GetTestAttempt), new { testId, attemptId = attempt.Id }, attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting test attempt for test {TestId}", testId);
                return StatusCode(500, "An error occurred while starting the test attempt");
            }
        }

        [HttpGet("{testId}/attempts/{attemptId}")]
        public async Task<ActionResult<TestAttemptDTO>> GetTestAttempt(string testId, string attemptId)
        {
            try
            {
                var userId = UserId;
                var attempt = await _testService.GetTestAttemptAsync(testId, attemptId, userId);
                
                if (attempt == null)
                {
                    return NotFound($"Test attempt with ID {attemptId} not found");
                }
                
                return Ok(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test attempt {AttemptId} for test {TestId}", attemptId, testId);
                return StatusCode(500, "An error occurred while retrieving the test attempt");
            }
        }

        [HttpPost("{testId}/attempts/{attemptId}/submit")]
        public async Task<ActionResult<TestAttemptDTO>> SubmitTestAttempt(string testId, string attemptId, SubmitTestDTO submitDto)
        {
            try
            {
                var userId = UserId;
                var attempt = await _testService.SubmitTestAttemptAsync(testId, attemptId, submitDto, userId);
                
                if (attempt == null)
                {
                    return NotFound($"Test attempt with ID {attemptId} not found");
                }
                
                return Ok(attempt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting test attempt {AttemptId} for test {TestId}", attemptId, testId);
                return StatusCode(500, "An error occurred while submitting the test attempt");
            }
        }

        [HttpGet("auth-debug")]
        public ActionResult<object> GetAuthDebugInfo()
        {
            try
            {
                var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                var authInfo = new
                {
                    IsAuthenticated = User.Identity.IsAuthenticated,
                    UserName = User.Identity.Name,
                    UserId = UserId,
                    Claims = claims,
                    Roles = new[] 
                    { 
                        new { Role = "Admin", IsInRole = IsAdmin },
                        new { Role = "Teacher", IsInRole = IsTeacher },
                        new { Role = "Student", IsInRole = IsStudent }
                    }
                };
                
                return Ok(authInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting auth debug info");
                return StatusCode(500, new { Error = "An error occurred while getting auth info", Message = ex.Message });
            }
        }
    }
} 