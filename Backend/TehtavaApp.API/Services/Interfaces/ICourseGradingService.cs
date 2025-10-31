using System.Collections.Generic;
using System.Threading.Tasks;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface ICourseGradingService
    {
        /// <summary>
        /// Calculate a student's grade for a course based on their assignment submissions
        /// </summary>
        Task<double> CalculateCourseGradeAsync(int courseId, string studentId);

        /// <summary>
        /// Save a course grade for a student
        /// </summary>
        Task<CourseGrade> SaveCourseGradeAsync(
            int courseId, 
            string studentId, 
            double grade, 
            string gradedById, 
            string feedback = "", 
            bool isFinal = false,
            GradingType gradingType = GradingType.Numeric);

        /// <summary>
        /// Get a student's course grade
        /// </summary>
        Task<CourseGradeDTO> GetStudentCourseGradeAsync(int courseId, string studentId);

        /// <summary>
        /// Get all course grades for a course
        /// </summary>
        Task<List<CourseGradeDTO>> GetCourseGradesAsync(int courseId);
    }
} 