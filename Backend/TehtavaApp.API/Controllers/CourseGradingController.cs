using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Controllers
{
    [ApiController]
    [Route("api/course-grading")]
    [Authorize]
    public class CourseGradingController : ControllerBase
    {
        private readonly ICourseGradingService _courseGradingService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CourseGradingController> _logger;

        public CourseGradingController(
            ICourseGradingService courseGradingService,
            UserManager<ApplicationUser> userManager,
            ILogger<CourseGradingController> logger)
        {
            _courseGradingService = courseGradingService;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/course-grading/calculate/{courseId}/{studentId}
        [HttpGet("calculate/{courseId}/{studentId}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> CalculateGrade(int courseId, string studentId)
        {
            try
            {
                var calculatedGrade = await _courseGradingService.CalculateCourseGradeAsync(courseId, studentId);
                return Ok(new { grade = calculatedGrade });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating grade for student {StudentId} in course {CourseId}", 
                    studentId, courseId);
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        // POST: api/course-grading
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> SaveGrade([FromBody] SaveCourseGradeDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = await _userManager.GetUserAsync(User);
                
                var courseGrade = await _courseGradingService.SaveCourseGradeAsync(
                    model.CourseId,
                    model.StudentId,
                    model.Grade,
                    user.Id,
                    model.Feedback,
                    model.IsFinal,
                    model.GradingType);

                return Ok(new { id = courseGrade.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving grade for student {StudentId} in course {CourseId}",
                    model.StudentId, model.CourseId);
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        // GET: api/course-grading/{courseId}/{studentId}
        [HttpGet("{courseId}/{studentId}")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetStudentGrade(int courseId, string studentId)
        {
            try
            {
                var grade = await _courseGradingService.GetStudentCourseGradeAsync(courseId, studentId);
                
                if (grade == null)
                {
                    return NotFound(new { message = "Course grade not found" });
                }

                // For students, only allow them to view their own grades
                if (User.IsInRole("Student") && User.Identity.Name != studentId)
                {
                    return Forbid();
                }

                return Ok(grade);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grade for student {StudentId} in course {CourseId}",
                    studentId, courseId);
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        // GET: api/course-grading/{courseId}
        [HttpGet("{courseId}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetCourseGrades(int courseId)
        {
            try
            {
                var grades = await _courseGradingService.GetCourseGradesAsync(courseId);
                return Ok(grades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grades for course {CourseId}", courseId);
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }
    }
} 