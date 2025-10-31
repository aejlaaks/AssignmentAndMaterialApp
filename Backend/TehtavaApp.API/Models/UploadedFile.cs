using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TehtavaApp.API.Models
{
    [Table("UploadedFiles")]
    public class UploadedFile
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FileType { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FileUrl { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [Required]
        [MaxLength(100)]
        public string Folder { get; set; } = "uploads";

        [MaxLength(50)]
        public string? SubmissionId { get; set; }

        public int? AssignmentId { get; set; }

        public int? MaterialId { get; set; }

        [MaxLength(50)]
        public string UploadedById { get; set; } = string.Empty;

        [MaxLength(255)]
        public string UploadedByName { get; set; } = string.Empty;

        [Required]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(255)]
        public string? Path { get; set; }

        [MaxLength(255)]
        public string? Url { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsStoredInCloud { get; set; }

        // Navigation properties
        public virtual Assignment? Assignment { get; set; }
        public virtual Material? Material { get; set; }

        // Helper property to get the associated course (not mapped to database)
        [NotMapped]
        public Course? AssociatedCourse => Assignment?.Course ?? Material?.Course;
        
        // Helper property to get course ID (not mapped to database)
        [NotMapped]
        public int? AssociatedCourseId => Assignment?.CourseId ?? Material?.CourseId;
    }
} 