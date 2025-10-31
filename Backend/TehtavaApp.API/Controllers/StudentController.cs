using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StudentController : ControllerBase
    {
        private readonly IStudentService _studentService;
        private readonly IAssignmentService _assignmentService;
        private readonly ICourseService _courseService;

        public StudentController(
            IStudentService studentService, 
            IAssignmentService assignmentService,
            ICourseService courseService)
        {
            _studentService = studentService;
            _assignmentService = assignmentService;
            _courseService = courseService;
        }

        // GET: api/student/{studentId}/assignments/stats?courseId={courseId}
        [HttpGet("{studentId}/assignments/stats")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetStudentAssignmentStats(string studentId, [FromQuery] string courseId)
        {
            if (string.IsNullOrEmpty(studentId) || string.IsNullOrEmpty(courseId))
            {
                return BadRequest("Student ID and Course ID are required.");
            }

            // Verify that the course exists
            var courseExists = await _courseService.DoesCourseExistAsync(int.Parse(courseId));
            if (!courseExists)
            {
                return NotFound("Course not found.");
            }

            // Get all assignments for the course
            var courseAssignments = await _assignmentService.GetCourseAssignmentsAsync(int.Parse(courseId));
            var totalAssignments = courseAssignments.Count();

            // Get the student's submissions for this course
            var studentSubmissions = await _assignmentService.GetStudentSubmissionsAsync(studentId);
            var courseSubmissions = studentSubmissions
                .Where(s => s.Assignment != null && s.Assignment.CourseId == int.Parse(courseId))
                .ToList();

            // Count submitted assignments (include all with grades or submissions)
            var submittedAssignments = courseSubmissions
                .Where(s => !string.IsNullOrEmpty(s.Grade?.ToString()) || s.Status == "submitted" || s.Status == "graded")
                .Select(s => s.AssignmentId)
                .Distinct()
                .Count();

            // If there are no actual submissions but there are graded assignments in the database,
            // we should account for them to match what's shown in the UI
            if (submittedAssignments == 0 && totalAssignments > 0)
            {
                // Get all assignments that have been graded for this student
                var gradedAssignmentsCount = courseSubmissions
                    .Where(s => !string.IsNullOrEmpty(s.Grade?.ToString()))
                    .Select(s => s.AssignmentId)
                    .Distinct()
                    .Count();
                
                if (gradedAssignmentsCount > 0)
                {
                    submittedAssignments = gradedAssignmentsCount;
                    // If we're showing grades for assignments in the UI, we should adjust 
                    // totalAssignments to match if it's less than the graded assignments
                    if (totalAssignments < gradedAssignmentsCount)
                    {
                        totalAssignments = gradedAssignmentsCount;
                    }
                }
            }

            // Calculate submission rate
            var submissionRate = totalAssignments > 0 
                ? (double)submittedAssignments / totalAssignments 
                : 0.0;

            return Ok(new
            {
                studentId,
                courseId,
                totalAssignments,
                submittedAssignments,
                submissionRate
            });
        }

        // GET: api/student/{studentId}/grades?courseId={courseId}
        [HttpGet("{studentId}/grades")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetStudentGrades(string studentId, [FromQuery] string courseId)
        {
            if (string.IsNullOrEmpty(studentId) || string.IsNullOrEmpty(courseId))
            {
                return BadRequest("Student ID and Course ID are required.");
            }

            try
            {
                // Verify that the course exists
                var courseExists = await _courseService.DoesCourseExistAsync(int.Parse(courseId));
                if (!courseExists)
                {
                    return NotFound("Course not found.");
                }

                // Get all assignments for the course
                var courseAssignments = await _assignmentService.GetCourseAssignmentsAsync(int.Parse(courseId));
                
                // Get the student's submissions for this course
                var studentSubmissions = await _assignmentService.GetStudentSubmissionsAsync(studentId);
                var courseSubmissions = studentSubmissions
                    .Where(s => s.Assignment != null && s.Assignment.CourseId == int.Parse(courseId))
                    .ToList();

                // Map submissions to grade objects
                var grades = courseSubmissions.Select(s => new
                {
                    assignmentId = s.AssignmentId,
                    title = s.Assignment?.Title,
                    maxGrade = s.Assignment?.MaxPoints ?? 5,
                    grade = s.Grade,
                    submittedAt = s.SubmittedAt,
                    isGraded = s.Grade != null
                }).ToList();

                return Ok(grades);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }
    }
} 