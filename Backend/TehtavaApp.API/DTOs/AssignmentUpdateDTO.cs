namespace TehtavaApp.API.DTOs;

public class AssignmentUpdateDTO
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string ContentMarkdown { get; set; } = "";
    public DateTime DueDate { get; set; }
    public string? Status { get; set; }
    public bool IsPublished { get; set; }
    public double? Points { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
}