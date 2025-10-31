using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TehtavaApp.API.Models;

public class Material
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Content { get; set; }
    public string Type { get; set; }
    public string FileUrl { get; set; }
    public string FileType { get; set; }
    public long FileSize { get; set; }
    public string FilePath { get; set; }
    public string ContentType { get; set; }
    public string CreatedById { get; set; }
    public int? CourseId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int AccessCount { get; set; }
    
    [NotMapped]
    public Dictionary<string, string> Metadata { get; set; } = new();

    // Navigation properties
    public virtual ApplicationUser CreatedBy { get; set; }
    public virtual Course Course { get; set; }
    public virtual ICollection<AssignmentSubmission> Submissions { get; set; }
    public virtual ICollection<UploadedFile> Files { get; set; }

    public Material()
    {
        Submissions = new HashSet<AssignmentSubmission>();
        Files = new HashSet<UploadedFile>();
        Metadata = new Dictionary<string, string>();
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        AccessCount = 0;
    }

    public static class MaterialType
    {
        public const string PDF = "PDF";
        public const string Document = "Document";
        public const string Image = "Image";
        public const string Video = "Video";
        public const string Audio = "Audio";
        public const string Link = "Link";
        public const string Text = "Text";
        public const string Code = "Code";
        public const string Other = "Other";
    }

    public static class ContentTypes
    {
        public const string PDF = "application/pdf";
        public const string PlainText = "text/plain";
        public const string Markdown = "text/markdown";
        public const string HTML = "text/html";
        public const string JPEG = "image/jpeg";
        public const string PNG = "image/png";
        public const string GIF = "image/gif";
        public const string WebP = "image/webp";
    }

    public void UpdateFileInfo(string fileUrl, string fileType, long fileSize, string filePath, string contentType)
    {
        FileUrl = fileUrl;
        FileType = fileType;
        FileSize = fileSize;
        FilePath = filePath;
        ContentType = contentType;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateContent(string content, string type)
    {
        Content = content;
        Type = type;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementAccessCount()
    {
        AccessCount++;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsDocument()
    {
        return Type == MaterialType.Document || Type == MaterialType.PDF || 
               FileType == MaterialType.Document || ContentType == ContentTypes.PDF;
    }

    public bool IsPDF()
    {
        return Type == MaterialType.PDF || ContentType == ContentTypes.PDF || 
               (FileType?.EndsWith("pdf", StringComparison.OrdinalIgnoreCase) ?? false);
    }

    public bool IsImage()
    {
        return Type == MaterialType.Image || 
               FileType == MaterialType.Image || 
               ContentType == ContentTypes.JPEG || 
               ContentType == ContentTypes.PNG || 
               ContentType == ContentTypes.GIF || 
               ContentType == ContentTypes.WebP || 
               ContentType?.StartsWith("image/") == true;
    }

    public bool IsVideo()
    {
        return Type == MaterialType.Video || FileType == MaterialType.Video;
    }

    public bool IsAudio()
    {
        return Type == MaterialType.Audio || FileType == MaterialType.Audio;
    }

    public bool IsLink()
    {
        return Type == MaterialType.Link || FileType == MaterialType.Link;
    }

    public bool IsText()
    {
        return Type == MaterialType.Text;
    }

    public bool IsCode()
    {
        return Type == MaterialType.Code;
    }

    public string GetFileExtension()
    {
        if (string.IsNullOrEmpty(FilePath))
            return string.Empty;

        return Path.GetExtension(FilePath).ToLowerInvariant();
    }

    public string GetFileName()
    {
        if (string.IsNullOrEmpty(FilePath))
            return string.Empty;

        return Path.GetFileName(FilePath);
    }

    public string GetFormattedFileSize()
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = FileSize;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}
