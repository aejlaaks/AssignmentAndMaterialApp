using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using Microsoft.Extensions.Logging;

namespace TehtavaApp.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentController : BaseController
    {
        private readonly IAssignmentService _assignmentService;
        private readonly ICourseService _courseService;
        private readonly IMapper _mapper;
        private readonly ILogger<AssignmentController> _logger;

        public AssignmentController(IAssignmentService assignmentService, ICourseService courseService, IMapper mapper, ILogger<AssignmentController> logger)
        {
            _assignmentService = assignmentService;
            _courseService = courseService;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAssignments()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("Käyttäjää ei tunnistettu. Kirjaudu sisään uudelleen.");
                }
                
                var assignments = await _assignmentService.GetStudentAssignmentsAsync(userId);
                
                // Convert to DTOs to ensure proper serialization of Status enum
                var assignmentDtos = assignments.Select(a => new AssignmentDTO
                {
                    Id = a.Id.ToString(),
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = a.DueDate,
                    Status = a.Status.ToString(), // Ensure Status is serialized as a string
                    CourseId = a.CourseId.ToString(),
                    CreatedById = a.CreatedById,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    IsOverdue = a.IsOverdue(),
                    Metadata = new Dictionary<string, string>()
                }).ToList();
                
                return Ok(assignmentDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Virhe tehtävien haussa: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAssignment(string id)
        {
            if (!int.TryParse(id, out int assignmentId))
                return BadRequest("Invalid assignment ID.");

            var assignment = await _assignmentService.GetAssignmentByIdAsync(assignmentId);
            if (assignment == null)
                return NotFound();

            // Log assignment status for debugging
            _logger.LogInformation($"Assignment {assignmentId} status: {assignment.Status}");

            // Create a combined response with all the information needed
            var response = new
            {
                Id = assignment.Id.ToString(),
                Title = assignment.Title,
                Description = assignment.Description,
                ContentMarkdown = assignment.ContentMarkdown,
                DueDate = assignment.DueDate,
                CreatedAt = assignment.CreatedAt,
                UpdatedAt = assignment.UpdatedAt,
                IsActive = assignment.IsActive,
                CourseId = assignment.CourseId.ToString(),
                CourseName = assignment.Course?.Name,
                CreatedById = assignment.CreatedById,
                CreatedByName = $"{assignment.CreatedBy?.FirstName} {assignment.CreatedBy?.LastName}".Trim(),
                Status = assignment.Status.ToString(), // Ensure status is serialized as a string
                SubmissionCount = assignment.Submissions?.Count ?? 0,
                RequiresRevision = assignment.RequiresRevision,
                MaxPoints = assignment.MaxPoints
            };

            return Ok(response);
        }

        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetCourseAssignments(string courseId)
        {
            try
            {
                int courseIdInt = int.Parse(courseId);
                var assignments = await _assignmentService.GetCourseAssignmentsAsync(courseIdInt);
                
                // Convert to DTOs for proper serialization
                var assignmentDtos = assignments.Select(a => new AssignmentDTO
                {
                    Id = a.Id.ToString(),
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = a.DueDate,
                    Status = a.Status.ToString(), // Ensure Status is serialized as a string
                    CourseId = a.CourseId.ToString(),
                    CreatedById = a.CreatedById,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    IsOverdue = a.IsOverdue(),
                    Metadata = new Dictionary<string, string>()
                }).ToList();
                
                return Ok(assignmentDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> CreateAssignment([FromBody] AssignmentCreateDTO dto)
        {
            if (!int.TryParse(dto.CourseId, out int courseId))
                return BadRequest("Invalid course ID.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var assignment = new Assignment
            {
                Title = dto.Title,
                Description = dto.Description,
                ContentMarkdown = dto.ContentMarkdown ?? "",
                DueDate = dto.DueDate,
                CourseId = courseId,
                CreatedById = userId,
                Status = AssignmentStatus.Published
            };

            var createdAssignment = await _assignmentService.CreateAssignmentAsync(assignment);
            
            return CreatedAtAction(nameof(GetAssignment), new { id = createdAssignment.Id }, createdAssignment);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateAssignment(string id, [FromBody] AssignmentUpdateDTO dto)
        {
            if (!int.TryParse(id, out int assignmentId))
                return BadRequest("Invalid assignment ID.");

            var existingAssignment = await _assignmentService.GetAssignmentByIdAsync(assignmentId);
            if (existingAssignment == null)
                return NotFound();

            // Update assignment properties
            existingAssignment.Title = dto.Title;
            existingAssignment.Description = dto.Description;
            existingAssignment.ContentMarkdown = dto.ContentMarkdown ?? existingAssignment.ContentMarkdown;
            existingAssignment.DueDate = dto.DueDate;
            existingAssignment.UpdatedAt = DateTime.UtcNow;
            
            if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<AssignmentStatus>(dto.Status, out var status))
            {
                existingAssignment.Status = status;
            }

            var updatedAssignment = await _assignmentService.UpdateAssignmentAsync(existingAssignment);
            
            return Ok(updatedAssignment);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> DeleteAssignment(string id)
        {
            try {
                _logger.LogInformation($"Attempting to delete assignment with ID: {id}");
                
                if (!int.TryParse(id, out int assignmentId))
                {
                    _logger.LogWarning($"Invalid assignment ID format: {id}");
                    return BadRequest("Invalid assignment ID format.");
                }

                var assignment = await _assignmentService.GetAssignmentByIdAsync(assignmentId);
                if (assignment == null)
                {
                    _logger.LogWarning($"Assignment not found with ID: {id}");
                    return NotFound($"Assignment with ID {id} not found.");
                }

                // Check if user has permission to delete this assignment
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (assignment.CreatedById != userId && !User.IsInRole("Admin"))
                {
                    _logger.LogWarning($"User {userId} attempted to delete assignment {id} without permission");
                    return Forbid("You don't have permission to delete this assignment.");
                }

                _logger.LogInformation($"Deleting assignment with ID: {id}");
                await _assignmentService.DeleteAssignmentAsync(assignmentId);
                
                _logger.LogInformation($"Successfully deleted assignment with ID: {id}");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting assignment {id}: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitAssignment(string id, [FromBody] AssignmentSubmissionDTO dto)
        {
            if (!int.TryParse(id, out int assignmentId))
                return BadRequest("Invalid assignment ID.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var submission = new AssignmentSubmission
            {
                AssignmentId = assignmentId,
                StudentId = userId,
                SubmissionText = dto.SubmissionText,
                Status = AssignmentStatus.Submitted.ToString()
            };

            var result = await _assignmentService.SubmitAssignmentAsync(submission);
            return CreatedAtAction(nameof(GetSubmission), new { id = result.Id }, result);
        }

        [HttpGet("submissions/{id}")]
        public async Task<IActionResult> GetSubmission(string id)
        {
            if (!int.TryParse(id, out int submissionId))
                return BadRequest("Invalid submission ID.");

            var submission = await _assignmentService.GetSubmissionByIdAsync(submissionId);
            if (submission == null)
                return NotFound();

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

        [HttpGet("submissions/student")]
        public async Task<IActionResult> GetStudentSubmissions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var submissions = await _assignmentService.GetStudentSubmissionsAsync(userId);
            return Ok(submissions);
        }

        [HttpPost("submissions/{id}/grade")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GradeSubmission(string id, [FromBody] AssignmentGradeDTO dto)
        {
            if (!int.TryParse(id, out int submissionId))
                return BadRequest("Invalid submission ID.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var result = await _assignmentService.GradeSubmissionAsync(
                submissionId, 
                dto.Grade?.ToString() ?? "", 
                dto.Feedback, 
                userId);
                
            if (result == null)
                return NotFound();

            return Ok(_mapper.Map<SubmissionResponseDto>(result));
        }

        [HttpPut("submissions/{id}")]
        public async Task<IActionResult> UpdateSubmission(string id, [FromBody] SubmissionUpdateDto dto)
        {
            if (!int.TryParse(id, out int submissionId) || submissionId != dto.Id)
                return BadRequest("Invalid submission ID or ID mismatch.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            // Get the current submission to check authorization
            var submission = await _assignmentService.GetSubmissionByIdAsync(submissionId);
            if (submission == null)
                return NotFound();

            // Check if user is authorized to update this submission
            if (submission.StudentId != userId && !User.IsInRole("Admin") && !User.IsInRole("Teacher"))
                return Forbid();

            // Update only content for student submissions
            submission.SubmissionText = dto.Content;
            
            // Revert to 'Submitted' status if was requiring revision
            if (submission.Status == "Returned" && submission.RequiresRevision)
            {
                submission.Status = "Submitted";
                submission.RequiresRevision = false;
            }

            // Save the updated submission
            var result = await _assignmentService.UpdateSubmissionAsync(submission);
            if (result == null)
                return StatusCode(500, "Failed to update submission");

            return Ok(_mapper.Map<SubmissionResponseDto>(result));
        }

        [HttpPost("{id}/return")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> ReturnSubmission(string id, [FromBody] AssignmentReturnDTO dto)
        {
            if (!int.TryParse(id, out var submissionId))
            {
                return BadRequest("Invalid submission ID format");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await _assignmentService.ReturnSubmissionAsync(
                submissionId,
                dto.Feedback,
                userId,
                dto.RequiresRevision);

            if (result == null)
            {
                return NotFound("Submission not found");
            }

            return Ok(_mapper.Map<SubmissionResponseDto>(result));
        }

        [HttpGet("courses/{id}/export")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> ExportCourseMaterials(string id, [FromQuery] string format)
        {
            if (!int.TryParse(id, out int courseId))
                return BadRequest("Invalid course ID.");

            var result = await _courseService.ExportCourseMaterialsAsync(courseId, format);
            if (!result)
                return NotFound("Export failed. Please check the course ID and format.");

            string filePath = Path.Combine("Exports", $"Course_{courseId}.{GetFileExtension(format)}");
            if (!System.IO.File.Exists(filePath))
                return NotFound("Exported file not found.");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            string mimeType = GetMimeType(format);
            string fileName = $"Course_{courseId}.{GetFileExtension(format)}";

            return File(fileBytes, mimeType, fileName);
        }

        [HttpGet("teacher")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetTeacherAssignments()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("Käyttäjää ei tunnistettu. Kirjaudu sisään uudelleen.");
                }
                
                // Get all assignments - for teachers we don't need to filter by enrollment
                var assignments = await _assignmentService.GetAssignmentsAsync();
                
                // Log raw assignments
                if (assignments.Any())
                {
                    var firstAssignment = assignments.First();
                    _logger.LogInformation($"Raw assignment status: {firstAssignment.Status} ({firstAssignment.Status.GetType().FullName})");
                }
                
                // Filter to assignments created by this teacher
                var teacherAssignments = assignments.Where(a => a.CreatedById == userId).ToList();
                
                // Process assignment statuses based on submissions, similar to GetStudentAssignmentsAsync
                foreach (var assignment in teacherAssignments)
                {
                    // If there are any submissions, update the assignment status based on them
                    if (assignment.Submissions != null && assignment.Submissions.Any())
                    {
                        // Find the most recent or relevant submission status
                        var mostRecentSubmission = assignment.Submissions
                            .OrderByDescending(s => s.SubmittedAt)
                            .FirstOrDefault();
                        
                        if (mostRecentSubmission != null)
                        {
                            // Set the assignment status based on the submission status
                            switch (mostRecentSubmission.Status.ToLower())
                            {
                                case "submitted":
                                    assignment.Status = TehtavaApp.API.Models.AssignmentStatus.Submitted;
                                    break;
                                case "graded":
                                    assignment.Status = TehtavaApp.API.Models.AssignmentStatus.Completed;
                                    break;
                                case "returned":
                                    assignment.Status = TehtavaApp.API.Models.AssignmentStatus.Returned;
                                    break;
                                default:
                                    // Keep the original status if submission status doesn't match known values
                                    break;
                            }
                        }
                    }
                    else if (DateTime.UtcNow > assignment.DueDate)
                    {
                        // If there's no submission and the assignment is past due date, mark as archived
                        assignment.Status = TehtavaApp.API.Models.AssignmentStatus.Archived;
                    }
                }
                
                // Log teacher assignments
                _logger.LogInformation($"Found {teacherAssignments.Count} assignments for teacher {userId}");
                foreach (var assignment in teacherAssignments.Take(3))
                {
                    _logger.LogInformation($"Assignment ID {assignment.Id}, Title: {assignment.Title}, Status: {assignment.Status} ({assignment.Status.GetType().FullName})");
                }
                
                // Convert to DTOs for proper serialization
                var assignmentDtos = teacherAssignments.Select(a => new AssignmentDTO
                {
                    Id = a.Id.ToString(),
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = a.DueDate,
                    Status = a.Status.ToString(), // Ensure Status is serialized as a string
                    CourseId = a.CourseId.ToString(),
                    CreatedById = a.CreatedById,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    IsOverdue = a.IsOverdue(),
                    Metadata = new Dictionary<string, string>()
                }).ToList();
                
                // Log DTOs 
                foreach (var dto in assignmentDtos.Take(3))
                {
                    _logger.LogInformation($"DTO ID {dto.Id}, Title: {dto.Title}, Status: {dto.Status} ({dto.Status.GetType().FullName})");
                }
                
                return Ok(assignmentDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Virhe tehtävien haussa: {ex.Message}");
            }
        }

        private string GetFileExtension(string format)
        {
            return format.ToLower() switch
            {
                "markdown" => "md",
                "html" => "html",
                "pdf" => "pdf",
                "text" => "txt",
                "photo" => "zip",
                _ => "txt",
            };
        }

        private string GetMimeType(string format)
        {
            return format.ToLower() switch
            {
                "markdown" => "text/markdown",
                "html" => "text/html",
                "pdf" => "application/pdf",
                "text" => "text/plain",
                "photo" => "application/zip",
                _ => "application/octet-stream",
            };
        }
    }
}
