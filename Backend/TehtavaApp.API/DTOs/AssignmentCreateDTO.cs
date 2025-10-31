namespace TehtavaApp.API.DTOs;

public class AssignmentCreateDTO
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string ContentMarkdown { get; set; } = "";
    public required DateTime DueDate { get; set; }
    public required string CourseId { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
}