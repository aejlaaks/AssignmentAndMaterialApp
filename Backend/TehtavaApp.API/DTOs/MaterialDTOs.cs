namespace TehtavaApp.API.DTOs
{
    public class MaterialDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Type { get; set; }
        public required string FileUrl { get; set; }
        public required string FileType { get; set; }
        public long FileSize { get; set; }
        public required string CreatedById { get; set; }
        public required string CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CourseId { get; set; }
        public string? CourseName { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class MaterialCreateDTO
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
        public string? Type { get; set; }  // Will be determined from file if not provided
        public string? Content { get; set; }
        public string? FileUrl { get; set; }
        public string? ContentType { get; set; }  // Will be determined from file if not provided
        public long? FileSize { get; set; }  // Will be determined from file
        public string? CourseId { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class MaterialUpdateDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public string? Content { get; set; }
        public string? Type { get; set; }
        public string? FileUrl { get; set; }
        public string? FileType { get; set; }
        public string? ContentType { get; set; }
        public long? FileSize { get; set; }
        public string? CourseId { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public List<string>? Tags { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class MaterialResponseDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Content { get; set; }
        public required string Type { get; set; }
        public required string FileUrl { get; set; }
        public required string ContentType { get; set; }
        public required string CreatedById { get; set; }
        public required string CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CourseId { get; set; }
        public string? CourseName { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class MaterialListItemDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Type { get; set; }
        public required string FileUrl { get; set; }
        public required string FileType { get; set; }
        public required string CreatedById { get; set; }
        public required string CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public int AccessCount { get; set; }
    }

    public class MaterialContentDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Type { get; set; }
        public required string Content { get; set; }
        public required string ContentType { get; set; }
        public required string Version { get; set; }
        public long ContentLength { get; set; }
        public string? Encoding { get; set; }
        public string? Language { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
        public Dictionary<string, object> ContentAttributes { get; set; } = new();
        public DateTime LastModified { get; set; }
        public string? ETag { get; set; }
        public string? CacheControl { get; set; }
        public bool IsCompressed { get; set; }
    }

    public class MaterialSearchResultDTO
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Type { get; set; }
        public string? FileUrl { get; set; }
        public string? ContentType { get; set; }
        public long FileSize { get; set; }
        public required string CreatedById { get; set; }
        public required string CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastModified { get; set; }
        public string? CourseId { get; set; }
        public string? CourseName { get; set; }
        public bool IsPublished { get; set; }
        public List<string>? Tags { get; set; }
        public int AccessCount { get; set; }
        public double RelevanceScore { get; set; }
        public double Relevance { get; set; }
        public Dictionary<string, string> Highlights { get; set; } = new();
    }
}
