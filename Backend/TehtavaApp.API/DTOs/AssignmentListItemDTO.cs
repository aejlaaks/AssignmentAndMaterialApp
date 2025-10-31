namespace TehtavaApp.API.DTOs
{
    public class AssignmentListItemDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public double? Grade { get; set; }
        public required string Status { get; set; }
        public required string CourseId { get; set; }
        public string? CourseName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsOverdue { get; set; }
        public int SubmissionsCount { get; set; }
        public int MaterialsCount { get; set; }
        public DateTime DueDate { get; set; }
    }
}
