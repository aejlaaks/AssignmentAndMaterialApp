using System;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.DTOs
{
    public class CourseGradeDTO
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string StudentId { get; set; }
        public string StudentName { get; set; }
        public double Grade { get; set; }
        public string GradedById { get; set; }
        public string GradedByName { get; set; }
        public DateTime GradedAt { get; set; }
        public string Feedback { get; set; }
        public bool IsFinal { get; set; }
        public GradingType GradingType { get; set; }
        public bool Passed { get; set; }
    }

    public class SaveCourseGradeDTO
    {
        public int CourseId { get; set; }
        public string StudentId { get; set; }
        public double Grade { get; set; }
        public string Feedback { get; set; }
        public bool IsFinal { get; set; }
        public GradingType GradingType { get; set; }
    }

    public class CourseGradeStatisticsDTO
    {
        public int TotalStudents { get; set; }
        public int GradedStudents { get; set; }
        public double AverageGrade { get; set; }
        public int[] GradeDistribution { get; set; } = new int[6]; // For grades 0-5
        public int PassCount { get; set; }
        public int FailCount { get; set; }
        public GradingType GradingType { get; set; }
    }
} 