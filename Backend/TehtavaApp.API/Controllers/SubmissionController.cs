using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.AspNetCore.Http;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using Newtonsoft.Json;

namespace TehtavaApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubmissionController : ControllerBase
    {
        private readonly IAssignmentService _assignmentService;
        private readonly ILogger<SubmissionController> _logger;
        private readonly IFileStorageService _fileStorageService;
        private readonly IAIGradingService _aiGradingService;

        public SubmissionController(
            IAssignmentService assignmentService, 
            ILogger<SubmissionController> logger,
            IFileStorageService fileStorageService,
            IAIGradingService aiGradingService)
        {
            _assignmentService = assignmentService;
            _logger = logger;
            _fileStorageService = fileStorageService;
            _aiGradingService = aiGradingService;
        }

        [HttpPost("assignment/{id}")]
        public async Task<IActionResult> SubmitAssignment(string id, [FromBody] object body)
        {
            try
            {
                // Parse the dynamic body to extract submission text
                dynamic submissionData = JsonConvert.DeserializeObject(body.ToString());
                string submissionText = null;
                
                // Try to extract SubmissionText from various formats
                try {
                    // Check if body is wrapped in a dto property
                    submissionText = submissionData?.dto?.SubmissionText;
                } catch {}
                
                if (string.IsNullOrEmpty(submissionText))
                {
                    // Try direct property access
                    try {
                        submissionText = submissionData?.SubmissionText;
                    } catch {}
                }
                
                if (string.IsNullOrEmpty(submissionText))
                {
                    // Try camelCase
                    try {
                        submissionText = submissionData?.submissionText;
                    } catch {}
                }
                
                if (string.IsNullOrEmpty(submissionText))
                {
                    return BadRequest(new { error = "Submission text is required and must be provided in one of these formats: dto.SubmissionText, SubmissionText, or submissionText." });
                }
                
                if (!int.TryParse(id, out int assignmentId))
                {
                    return BadRequest(new { error = "Invalid assignment ID." });
                }

                // Check if the assignment exists
                var assignment = await _assignmentService.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                {
                    return NotFound(new { error = $"Assignment with ID {assignmentId} not found." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                // Create the submission object
                var submission = new AssignmentSubmission
                {
                    AssignmentId = assignmentId,
                    StudentId = userId,
                    SubmissionText = submissionText,
                    Status = AssignmentStatus.Submitted.ToString(),
                    FeedbackText = string.Empty // Initialize FeedbackText to empty string
                };

                _logger.LogInformation($"Creating submission for assignment {assignmentId} by user {userId}");
                
                var result = await _assignmentService.SubmitAssignmentAsync(submission);
                return CreatedAtAction(nameof(GetSubmission), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting assignment {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        // Alternative endpoint that uses a simpler DTO format
        [HttpPost("assignment/{id}/simple")]
        public async Task<IActionResult> SubmitAssignmentSimple(string id, [FromBody] object body)
        {
            try
            {
                // Parse the dynamic body to extract submission text
                dynamic submissionData = Newtonsoft.Json.JsonConvert.DeserializeObject(body.ToString());
                string submissionText = null;
                
                // Try to extract submissionText from various formats (camelCase first since this is the simple endpoint)
                try {
                    submissionText = submissionData?.submissionText;
                } catch {}
                
                if (string.IsNullOrEmpty(submissionText))
                {
                    // Try PascalCase
                    try {
                        submissionText = submissionData?.SubmissionText;
                    } catch {}
                }
                
                // As a last resort, try if the whole body is just a string
                if (string.IsNullOrEmpty(submissionText) && body is string bodyString)
                {
                    submissionText = bodyString;
                }
                
                if (string.IsNullOrEmpty(submissionText))
                {
                    _logger.LogWarning($"Submission text not found in request data: {body}");
                    return BadRequest(new { error = "Submission text is required. Please provide it as 'submissionText' or 'SubmissionText' property." });
                }
                
                if (!int.TryParse(id, out int assignmentId))
                {
                    return BadRequest(new { error = "Invalid assignment ID." });
                }

                // Check if the assignment exists
                var assignment = await _assignmentService.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                {
                    return NotFound(new { error = $"Assignment with ID {assignmentId} not found." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                var submission = new AssignmentSubmission
                {
                    AssignmentId = assignmentId,
                    StudentId = userId,
                    SubmissionText = submissionText,
                    Status = AssignmentStatus.Submitted.ToString(),
                    FeedbackText = string.Empty // Initialize FeedbackText to empty string
                };

                _logger.LogInformation($"Creating submission for assignment {assignmentId} by user {userId}");
                
                var result = await _assignmentService.SubmitAssignmentAsync(submission);
                return CreatedAtAction(nameof(GetSubmission), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error submitting assignment {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSubmission(string id)
        {
            try
            {
                if (!int.TryParse(id, out int submissionId))
                {
                    return BadRequest(new { error = "Invalid submission ID." });
                }

                var submission = await _assignmentService.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    return NotFound(new { error = "Submission not found." });
                }

                // Check if user is authorized to view this submission
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (submission.StudentId != userId && 
                    submission.Assignment.CreatedById != userId && 
                    !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                return Ok(submission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("student")]
        public async Task<IActionResult> GetStudentSubmissions()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                var submissions = await _assignmentService.GetStudentSubmissionsAsync(userId);
                return Ok(submissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving student submissions");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("assignment/{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetSubmissionsByAssignment(string id)
        {
            try
            {
                if (!int.TryParse(id, out int assignmentId))
                {
                    return BadRequest(new { error = "Invalid assignment ID." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                // Get the submissions for this assignment
                var submissions = await _assignmentService.GetSubmissionsByAssignmentAsync(assignmentId);
                
                return Ok(submissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving submissions for assignment {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("pending/count")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult<int>> GetPendingSubmissionsCount([FromQuery] string courseId = null)
        {
            try
            {
                // Use the appropriate method from assignmentService
                var count = await _assignmentService.GetPendingSubmissionsCountAsync(courseId);
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending submissions count");
                return StatusCode(500, new { error = "An error occurred while retrieving the pending submissions count." });
            }
        }

        [HttpPost("{id}/grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GradeSubmission(string id, [FromBody] AssignmentGradeDTO dto)
        {
            try
            {
                if (!int.TryParse(id, out int submissionId))
                {
                    return BadRequest(new { error = "Invalid submission ID." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                // Convert the grade to a string (service method expects it)
                string gradeStr = dto.Grade.HasValue ? dto.Grade.ToString() : null;
                
                var result = await _assignmentService.GradeSubmissionAsync(
                    submissionId,
                    gradeStr,
                    dto.Feedback,
                    userId
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error grading submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{id}/return")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> ReturnSubmission(string id, [FromBody] AssignmentReturnDTO dto)
        {
            try
            {
                if (!int.TryParse(id, out int submissionId))
                {
                    return BadRequest(new { error = "Invalid submission ID." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }
                
                var result = await _assignmentService.ReturnSubmissionAsync(
                    submissionId,
                    dto.Feedback,
                    userId,
                    dto.RequiresRevision
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error returning submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{id}/files")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50MB limit
        public async Task<IActionResult> UploadSubmissionFiles(string id, [FromForm] List<IFormFile> files)
        {
            try
            {
                if (files == null || !files.Any())
                {
                    return BadRequest(new { error = "No files provided" });
                }

                // Validate submission exists
                var submission = await _assignmentService.GetSubmissionByIdAsync(int.Parse(id));
                if (submission == null)
                {
                    return NotFound(new { error = $"Submission with ID {id} not found." });
                }

                // Verify the user is authorized to upload files to this submission
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (submission.StudentId != userId && !User.IsInRole("Teacher") && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                // Create folder path based on submission ID
                var folderPath = $"submissions/{id}";
                
                var uploadResults = new List<UploadedFile>();
                
                foreach (var file in files)
                {
                    if (file.Length > 0)
                    {
                        try
                        {
                            // Create memory stream from the file
                            using var stream = file.OpenReadStream();
                            
                            // Generate unique filename
                            var uniqueFileName = $"{Guid.NewGuid()}{System.IO.Path.GetExtension(file.FileName)}";
                            
                            // Upload to Azure Blob Storage using IFileStorageService
                            var uploadedFile = await _fileStorageService.UploadFileWithMetadataAsync(
                                stream,
                                uniqueFileName,
                                file.ContentType,
                                folderPath,
                                file.FileName
                            );
                            
                            // Associate the file with the submission
                            await _fileStorageService.AssociateFileWithSubmissionAsync(uploadedFile.Id, id);
                            
                            uploadResults.Add(uploadedFile);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error uploading file {file.FileName} for submission {id}");
                        }
                    }
                }

                if (!uploadResults.Any())
                {
                    return StatusCode(500, new { error = "Failed to upload any files" });
                }

                return Ok(uploadResults);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling file uploads for submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("{id}/files")]
        public async Task<IActionResult> GetSubmissionFiles(string id)
        {
            try
            {
                // Validate submission exists
                var submission = await _assignmentService.GetSubmissionByIdAsync(int.Parse(id));
                if (submission == null)
                {
                    return NotFound(new { error = $"Submission with ID {id} not found." });
                }

                // Verify the user is authorized to access files of this submission
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (submission.StudentId != userId && 
                    submission.Assignment?.CreatedById != userId && 
                    !User.IsInRole("Teacher") && 
                    !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                // Get files associated with the submission
                var files = await _fileStorageService.GetFilesBySubmissionAsync(id);
                
                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving files for submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpDelete("{id}/files/{fileId}")]
        public async Task<IActionResult> DeleteSubmissionFile(string id, string fileId)
        {
            try
            {
                // Validate submission exists
                var submission = await _assignmentService.GetSubmissionByIdAsync(int.Parse(id));
                if (submission == null)
                {
                    return NotFound(new { error = $"Submission with ID {id} not found." });
                }

                // Verify the user is authorized to delete files from this submission
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                // Only the student who made the submission or a teacher/admin can delete files
                if (submission.StudentId != userId && !User.IsInRole("Teacher") && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                // Verify the file exists and is associated with this submission
                var file = await _fileStorageService.GetFileByIdAsync(fileId);
                if (file == null)
                {
                    return NotFound(new { error = $"File with ID {fileId} not found." });
                }

                if (file.SubmissionId != id)
                {
                    return BadRequest(new { error = "The file is not associated with this submission." });
                }

                // Delete the file
                var result = await _fileStorageService.DeleteFileByIdAsync(fileId);
                if (!result)
                {
                    return StatusCode(500, new { error = "Failed to delete the file." });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file {fileId} from submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{id}/ai-grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GenerateAIGrading(string id)
        {
            try
            {
                if (!int.TryParse(id, out int submissionId))
                {
                    return BadRequest(new { error = "Invalid submission ID." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                // Generate AI grading suggestion
                var aiResult = await _aiGradingService.GenerateGradingSuggestionAsync(submissionId);
                
                return Ok(aiResult);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, $"AI grading not available for submission {id}");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating AI grading for submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{id}/apply-ai-grade")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> ApplyAIGrading(string id, [FromBody] AIGradingResult aiResult)
        {
            try
            {
                if (!int.TryParse(id, out int submissionId))
                {
                    return BadRequest(new { error = "Invalid submission ID." });
                }

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated." });
                }

                // Get the submission
                var submission = await _assignmentService.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    return NotFound(new { error = $"Submission with ID {submissionId} not found." });
                }

                // Create metadata JSON
                var metadata = new AIGradingMetadata
                {
                    Provider = aiResult.Provider,
                    Model = aiResult.Model,
                    Confidence = aiResult.Confidence,
                    GradedAt = DateTime.UtcNow,
                    Version = "1.0"
                };
                
                var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata);

                // Apply the AI grading using the new method
                submission.MarkAsAIGraded(userId, aiResult.Grade, aiResult.Feedback, metadataJson);
                
                // Save changes would typically be done through the service
                var result = await _assignmentService.GradeSubmissionAsync(
                    submissionId,
                    aiResult.Grade.ToString(),
                    aiResult.Feedback,
                    userId
                );

                // Update AI-specific fields
                result.IsAIGraded = true;
                result.AIGradingMetadata = metadataJson;

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error applying AI grading to submission {id}");
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }
    }

    // Wrapper class to support the dto property in the request
    public class SubmissionWrapper
    {
        public SimpleSubmissionDTO dto { get; set; }
    }
} 