namespace TehtavaApp.API.DTOs;

public class AssignmentSubmissionDTO
{
    public required string Id { get; set; }
    public required string AssignmentId { get; set; }
    public required string StudentId { get; set; }
    public required string SubmissionText { get; set; }
    public required string Status { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
    public double? Grade { get; set; }
    public string? FeedbackText { get; set; }
    public string? GradedById { get; set; }
    public int AttemptNumber { get; set; }
    public bool RequiresRevision { get; set; }
    public bool IsLate { get; set; }
    public List<MaterialDTO> SubmittedMaterials { get; set; } = new();
}