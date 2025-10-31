using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services
{
    /// <summary>
    /// Service for proxying access to images stored in blob storage
    /// </summary>
    public class ImageProxyService
    {
        private readonly IFileReader _fileReader;
        private readonly IMimeTypeResolver _mimeTypeResolver;
        private readonly ILogger<ImageProxyService> _logger;

        public ImageProxyService(
            IFileReader fileReader,
            IMimeTypeResolver mimeTypeResolver,
            ILogger<ImageProxyService> logger)
        {
            _fileReader = fileReader;
            _mimeTypeResolver = mimeTypeResolver;
            _logger = logger;
        }

        /// <summary>
        /// Get an image from storage by filename
        /// </summary>
        /// <param name="filename">Image filename</param>
        /// <returns>Tuple containing the image stream and content type</returns>
        public async Task<(Stream Content, string ContentType)> GetImageAsync(string filename)
        {
            try
            {
                // Check for null or empty filename
                if (string.IsNullOrEmpty(filename))
                {
                    _logger.LogWarning("Attempted to retrieve image with null or empty filename");
                    return (null, null);
                }

                // Sanitize the filename to prevent directory traversal attacks
                filename = Path.GetFileName(filename);
                
                // Try to get the file from the markdown-images folder
                string blobPath = $"markdown-images/{filename}";
                _logger.LogInformation($"Attempting to retrieve image from path: {blobPath}");
                
                var fileStream = await _fileReader.GetFileAsync(blobPath);
                
                if (fileStream == null)
                {
                    _logger.LogWarning($"Image not found at path: {blobPath}");
                    return (null, null);
                }
                
                // Determine the content type based on file extension
                string contentType = _mimeTypeResolver.GetMimeType(filename);
                _logger.LogInformation($"Retrieved image {filename} with content type {contentType}");
                
                return (fileStream, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving image {filename}");
                return (null, null);
            }
        }

        /// <summary>
        /// Extract the filename from a blob storage URL
        /// </summary>
        /// <param name="url">Full blob storage URL</param>
        /// <returns>Extracted filename</returns>
        public string ExtractFilenameFromBlobUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
                return null;
                
            try
            {
                // Check if the URL is from our blob storage
                if (url.Contains("blob.core.windows.net/uploads/markdown-images/"))
                {
                    // Extract just the filename from the URL
                    return Path.GetFileName(url);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error extracting filename from URL: {url}");
                return null;
            }
        }
    }
} 