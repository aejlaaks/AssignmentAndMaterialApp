using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Data;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services
{
    public class CourseGradingService : ICourseGradingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CourseGradingService> _logger;
        private readonly INotificationService _notificationService;

        public CourseGradingService(
            ApplicationDbContext context,
            ILogger<CourseGradingService> logger,
            INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        /// <inheritdoc/>
        public async Task<double> CalculateCourseGradeAsync(int courseId, string studentId)
        {
            try
            {
                // Get all the student's graded submissions for this course
                var submissions = await _context.AssignmentSubmissions
                    .Include(s => s.Assignment)
                    .Where(s => s.StudentId == studentId && 
                                s.Assignment.CourseId == courseId && 
                                s.Grade.HasValue)
                    .ToListAsync();

                if (!submissions.Any())
                {
                    return 0; // No graded submissions yet
                }

                // Get the total possible points for the course (from all assignments)
                var courseAssignments = await _context.Assignments
                    .Where(a => a.CourseId == courseId && a.IsActive)
                    .ToListAsync();

                double totalPointsAchieved = 0;
                double totalPointsPossible = 0;

                // Calculate the weighted sum of grades
                foreach (var assignment in courseAssignments)
                {
                    var submission = submissions
                        .Where(s => s.AssignmentId == assignment.Id)
                        .OrderByDescending(s => s.Grade)
                        .FirstOrDefault();

                    double assignmentMaxPoints = assignment.MaxPoints ?? 5.0; // Default to 5 if not specified
                    totalPointsPossible += assignmentMaxPoints;

                    if (submission != null && submission.Grade.HasValue)
                    {
                        totalPointsAchieved += submission.Grade.Value;
                    }
                }

                // Calculate final grade (normalized to a scale of 0-5)
                double finalGrade = (totalPointsPossible > 0) 
                    ? Math.Round((totalPointsAchieved / totalPointsPossible) * 5, 1) 
                    : 0;

                return finalGrade;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating course grade for student {StudentId} in course {CourseId}", 
                    studentId, courseId);
                throw;
            }
        }

        /// <inheritdoc/>
        public async Task<CourseGrade> SaveCourseGradeAsync(
            int courseId, 
            string studentId, 
            double grade, 
            string gradedById, 
            string feedback = "", 
            bool isFinal = false,
            GradingType gradingType = GradingType.Numeric)
        {
            try
            {
                // Check if the grade already exists
                var existingGrade = await _context.CourseGrades
                    .FirstOrDefaultAsync(g => g.CourseId == courseId && g.StudentId == studentId);

                if (existingGrade != null)
                {
                    // Update existing grade
                    existingGrade.Grade = grade;
                    existingGrade.GradedById = gradedById;
                    existingGrade.GradedAt = DateTime.UtcNow;
                    existingGrade.Feedback = feedback;
                    existingGrade.IsFinal = isFinal;
                    existingGrade.GradingType = gradingType;

                    _context.CourseGrades.Update(existingGrade);
                    await _context.SaveChangesAsync();

                    return existingGrade;
                }
                else
                {
                    // Create new grade
                    var courseGrade = new CourseGrade
                    {
                        CourseId = courseId,
                        StudentId = studentId,
                        Grade = grade,
                        GradedById = gradedById,
                        Feedback = feedback,
                        IsFinal = isFinal,
                        GradingType = gradingType
                    };

                    _context.CourseGrades.Add(courseGrade);
                    await _context.SaveChangesAsync();

                    return courseGrade;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving course grade for student {StudentId} in course {CourseId}",
                    studentId, courseId);
                throw;
            }
        }

        /// <inheritdoc/>
        public async Task<CourseGradeDTO> GetStudentCourseGradeAsync(int courseId, string studentId)
        {
            try
            {
                var courseGrade = await _context.CourseGrades
                    .Include(g => g.GradedBy)
                    .FirstOrDefaultAsync(g => g.CourseId == courseId && g.StudentId == studentId);

                if (courseGrade == null)
                {
                    return null;
                }

                return new CourseGradeDTO
                {
                    Id = courseGrade.Id,
                    CourseId = courseGrade.CourseId,
                    StudentId = courseGrade.StudentId,
                    Grade = courseGrade.Grade,
                    GradedById = courseGrade.GradedById,
                    GradedByName = $"{courseGrade.GradedBy.FirstName} {courseGrade.GradedBy.LastName}",
                    GradedAt = courseGrade.GradedAt,
                    Feedback = courseGrade.Feedback,
                    IsFinal = courseGrade.IsFinal,
                    GradingType = courseGrade.GradingType,
                    Passed = courseGrade.Passed
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving course grade for student {StudentId} in course {CourseId}",
                    studentId, courseId);
                throw;
            }
        }

        /// <inheritdoc/>
        public async Task<List<CourseGradeDTO>> GetCourseGradesAsync(int courseId)
        {
            try
            {
                var courseGrades = await _context.CourseGrades
                    .Include(g => g.Student)
                    .Include(g => g.GradedBy)
                    .Where(g => g.CourseId == courseId)
                    .ToListAsync();

                return courseGrades.Select(g => new CourseGradeDTO
                {
                    Id = g.Id,
                    CourseId = g.CourseId,
                    StudentId = g.StudentId,
                    StudentName = $"{g.Student.FirstName} {g.Student.LastName}",
                    Grade = g.Grade,
                    GradedById = g.GradedById,
                    GradedByName = $"{g.GradedBy.FirstName} {g.GradedBy.LastName}",
                    GradedAt = g.GradedAt,
                    Feedback = g.Feedback,
                    IsFinal = g.IsFinal,
                    GradingType = g.GradingType,
                    Passed = g.Passed
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all course grades for course {CourseId}", courseId);
                throw;
            }
        }
    }
} 