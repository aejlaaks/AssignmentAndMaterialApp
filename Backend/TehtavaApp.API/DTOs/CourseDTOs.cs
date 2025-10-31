using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.DTOs
{
    public class CourseDTO
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        public required string TeacherId { get; set; }
        public required string TeacherName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public int EnrollmentCount { get; set; }
        public int AssignmentCount { get; set; }
        public int MaterialCount { get; set; }
        public int StudentCount { get; set; }
        public List<UserListItemDTO> Students { get; set; } = new();
        public List<UserDTO> Teachers { get; set; } = new();
        public List<AssignmentListItemDTO> Assignments { get; set; } = new();
        public List<MaterialListItemDTO> Materials { get; set; } = new();
        public List<object> ContentBlocks { get; set; } = new();
        public Dictionary<string, string> Metadata { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CourseListItemDTO
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        public required string TeacherName { get; set; }
        public required string Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public int EnrollmentCount { get; set; }
        public int AssignmentCount { get; set; }
        public int StudentCount { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class CourseCreateDTO
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public string TeacherId { get; set; }
        [Required]
        public string Code { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        public List<object> ContentBlocks { get; set; } = new();
    }

    public class CourseUpdateDTO
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public string Code { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public List<object> ContentBlocks { get; set; } = new();
    }

    public class CourseEnrollmentDTO
    {
        [Required]
        public string StudentId { get; set; }
        public string Status { get; set; } = "Active";
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class CourseStatsDTO
    {
        public int TotalStudents { get; set; }
        public int ActiveStudents { get; set; }
        public int CompletedAssignments { get; set; }
        public int PendingAssignments { get; set; }
        public double AverageGrade { get; set; }
        public Dictionary<string, int> ActivityByWeek { get; set; } = new();
        public Dictionary<string, double> GradeDistribution { get; set; } = new();
    }

    public class CourseTeacherDTO
    {
        [Required]
        public string TeacherId { get; set; }
    }

    public class CourseDetailDTO
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string TeacherId { get; set; }
        public string TeacherName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public int StudentCount { get; set; }
        public int AssignmentCount { get; set; }
        public int SubmissionCount { get; set; }
        public int GradedCount { get; set; }
        public int PendingAssignments { get; set; }
        public double AverageGrade { get; set; }
        public Dictionary<string, int> ActivityByWeek { get; set; } = new();
        public Dictionary<string, double> GradeDistribution { get; set; } = new();
    }
}
