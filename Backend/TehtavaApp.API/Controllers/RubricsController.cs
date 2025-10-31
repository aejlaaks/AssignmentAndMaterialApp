using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Services;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/rubrics")]
    [Authorize]
    public class RubricsController : ControllerBase
    {
        private readonly IRubricService _rubricService;
        private readonly ILogger<RubricsController> _logger;

        public RubricsController(IRubricService rubricService, ILogger<RubricsController> logger)
        {
            _rubricService = rubricService;
            _logger = logger;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Rubric>> GetRubric(string id)
        {
            try
            {
                var rubric = await _rubricService.GetRubricByIdAsync(id);
                if (rubric == null)
                {
                    return NotFound();
                }
                return Ok(rubric);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rubric with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the rubric.");
            }
        }

        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<Rubric>> GetRubricByAssignment(string assignmentId)
        {
            try
            {
                var rubric = await _rubricService.GetRubricByAssignmentAsync(assignmentId);
                if (rubric == null)
                {
                    return NotFound();
                }
                return Ok(rubric);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rubric for assignment with ID {AssignmentId}", assignmentId);
                return StatusCode(500, "An error occurred while retrieving the rubric.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Rubric>> CreateRubric(Rubric rubric)
        {
            try
            {
                var createdRubric = await _rubricService.CreateRubricAsync(rubric);
                return CreatedAtAction(nameof(GetRubric), new { id = createdRubric.Id }, createdRubric);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating rubric");
                return StatusCode(500, "An error occurred while creating the rubric.");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Rubric>> UpdateRubric(string id, Rubric rubric)
        {
            if (id != rubric.Id)
            {
                return BadRequest("The ID in the URL does not match the ID in the request body.");
            }

            try
            {
                var updatedRubric = await _rubricService.UpdateRubricAsync(id, rubric);
                if (updatedRubric == null)
                {
                    return NotFound();
                }
                return Ok(updatedRubric);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rubric with ID {Id}", id);
                return StatusCode(500, "An error occurred while updating the rubric.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRubric(string id)
        {
            try
            {
                var result = await _rubricService.DeleteRubricAsync(id);
                if (!result)
                {
                    return NotFound();
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting rubric with ID {Id}", id);
                return StatusCode(500, "An error occurred while deleting the rubric.");
            }
        }

        [HttpPost("grade/{submissionId}")]
        public async Task<ActionResult> GradeWithRubric(string submissionId, RubricGradeDTO gradeData)
        {
            try
            {
                var result = await _rubricService.GradeWithRubricAsync(submissionId, gradeData);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error grading submission {SubmissionId} with rubric", submissionId);
                return StatusCode(500, "An error occurred while grading the submission.");
            }
        }

        [HttpGet("grades/{submissionId}")]
        public async Task<ActionResult<RubricGradeDTO>> GetRubricGrades(string submissionId)
        {
            try
            {
                var grades = await _rubricService.GetRubricGradesAsync(submissionId);
                if (grades == null)
                {
                    return NotFound();
                }
                return Ok(grades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rubric grades for submission {SubmissionId}", submissionId);
                return StatusCode(500, "An error occurred while retrieving the rubric grades.");
            }
        }
    }
} 