using System;
using System.IO;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services
{
    /// <summary>
    /// Service for resolving MIME types from filenames or file extensions
    /// </summary>
    public class MimeTypeResolver : IMimeTypeResolver
    {
        private readonly ILogger<MimeTypeResolver> _logger;

        public MimeTypeResolver(ILogger<MimeTypeResolver> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Gets the MIME type for a file based on its filename or extension
        /// </summary>
        public string GetMimeType(string filename)
        {
            if (string.IsNullOrEmpty(filename))
                return "application/octet-stream";

            try
            {
                string extension = Path.GetExtension(filename).ToLowerInvariant();
                
                return extension switch
                {
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    ".webp" => "image/webp",
                    ".svg" => "image/svg+xml",
                    ".pdf" => "application/pdf",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ".xls" => "application/vnd.ms-excel",
                    ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ".ppt" => "application/vnd.ms-powerpoint",
                    ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    ".txt" => "text/plain",
                    ".html" or ".htm" => "text/html",
                    ".css" => "text/css",
                    ".js" => "application/javascript",
                    ".json" => "application/json",
                    ".xml" => "application/xml",
                    ".zip" => "application/zip",
                    ".rar" => "application/x-rar-compressed",
                    ".7z" => "application/x-7z-compressed",
                    ".mp3" => "audio/mpeg",
                    ".mp4" => "video/mp4",
                    ".avi" => "video/x-msvideo",
                    ".mov" => "video/quicktime",
                    ".md" => "text/markdown",
                    _ => "application/octet-stream"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error resolving MIME type for {filename}");
                return "application/octet-stream";
            }
        }
    }
} 