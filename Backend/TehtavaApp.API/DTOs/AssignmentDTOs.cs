namespace TehtavaApp.API.DTOs
{
    public class AssignmentDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public double? Grade { get; set; }
        public string? Feedback { get; set; }
        public DateTime DueDate { get; set; }
        public required string Status { get; set; }
        public required string CourseId { get; set; }
        public required string CreatedById { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsOverdue { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class AssignmentGradeDTO
    {
        public double? Grade { get; set; }
        public required string Feedback { get; set; }
        public bool RequiresRevision { get; set; }
        public DateTime? RevisionDueDate { get; set; }
        public string? Notes { get; set; }
    }

    public class AssignmentStatsDTO
    {
        public int TotalSubmissions { get; set; }
        public int GradedSubmissions { get; set; }
        public int PendingSubmissions { get; set; }
        public double AverageGrade { get; set; }
        public Dictionary<string, int> GradeDistribution { get; set; } = new();
        public Dictionary<string, double> CompletionRates { get; set; } = new();
    }
}
