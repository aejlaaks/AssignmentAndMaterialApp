using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Backend.Models;
using Backend.Services;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/grading-history")]
    [Authorize]
    public class GradingHistoryController : ControllerBase
    {
        private readonly IGradingHistoryService _gradingHistoryService;
        private readonly ILogger<GradingHistoryController> _logger;

        public GradingHistoryController(IGradingHistoryService gradingHistoryService, ILogger<GradingHistoryController> logger)
        {
            _gradingHistoryService = gradingHistoryService;
            _logger = logger;
        }

        [HttpGet("submission/{submissionId}")]
        public async Task<ActionResult<IEnumerable<GradingHistory>>> GetBySubmission(string submissionId)
        {
            try
            {
                var history = await _gradingHistoryService.GetGradingHistoryBySubmissionAsync(submissionId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading history for submission {SubmissionId}", submissionId);
                return StatusCode(500, "An error occurred while retrieving the grading history.");
            }
        }

        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<IEnumerable<GradingHistory>>> GetByAssignment(string assignmentId)
        {
            try
            {
                var history = await _gradingHistoryService.GetGradingHistoryByAssignmentAsync(assignmentId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading history for assignment {AssignmentId}", assignmentId);
                return StatusCode(500, "An error occurred while retrieving the grading history.");
            }
        }

        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<GradingHistory>>> GetByTeacher(string teacherId)
        {
            try
            {
                var history = await _gradingHistoryService.GetGradingHistoryByTeacherAsync(teacherId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading history for teacher {TeacherId}", teacherId);
                return StatusCode(500, "An error occurred while retrieving the grading history.");
            }
        }

        [HttpPost("revert/{historyId}")]
        public async Task<ActionResult> RevertToHistoryVersion(string historyId)
        {
            try
            {
                var result = await _gradingHistoryService.RevertToHistoryVersionAsync(historyId);
                if (!result)
                {
                    return NotFound("The specified history version was not found.");
                }
                return Ok(new { message = "Successfully reverted to the specified history version." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reverting to history version {HistoryId}", historyId);
                return StatusCode(500, "An error occurred while reverting to the history version.");
            }
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<GradingStatisticsDTO>> GetGradingStatistics(
            [FromQuery] string teacherId = null,
            [FromQuery] string assignmentId = null,
            [FromQuery] string courseId = null,
            [FromQuery] string startDate = null,
            [FromQuery] string endDate = null)
        {
            try
            {
                var filters = new GradingHistoryFilterDTO
                {
                    TeacherId = teacherId,
                    AssignmentId = assignmentId,
                    CourseId = courseId,
                    StartDate = string.IsNullOrEmpty(startDate) ? null : DateTime.Parse(startDate),
                    EndDate = string.IsNullOrEmpty(endDate) ? null : DateTime.Parse(endDate)
                };

                var statistics = await _gradingHistoryService.GetGradingStatisticsAsync(filters);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading statistics");
                return StatusCode(500, "An error occurred while retrieving the grading statistics.");
            }
        }
    }
} 