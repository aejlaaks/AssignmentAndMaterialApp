using System;
using System.Collections.Generic;

namespace Backend.DTOs
{
    public class GradingHistoryFilterDTO
    {
        public string TeacherId { get; set; }
        public string AssignmentId { get; set; }
        public string CourseId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class GradingStatisticsDTO
    {
        public int TotalGraded { get; set; }
        public double AverageGrade { get; set; }
        public Dictionary<string, int> GradingsByDay { get; set; } = new Dictionary<string, int>();
        public int[] GradeDistribution { get; set; } = new int[6]; // For grades 0-5
        public List<RecentActivityDTO> RecentActivity { get; set; } = new List<RecentActivityDTO>();
    }

    public class RecentActivityDTO
    {
        public string Id { get; set; }
        public string SubmissionId { get; set; }
        public string StudentId { get; set; }
        public string StudentName { get; set; }
        public string AssignmentId { get; set; }
        public string AssignmentTitle { get; set; }
        public string CourseId { get; set; }
        public string CourseName { get; set; }
        public string TeacherId { get; set; }
        public string TeacherName { get; set; }
        public double? Grade { get; set; }
        public string Type { get; set; } // "graded", "returned", etc.
        public DateTime Timestamp { get; set; }
    }
} 