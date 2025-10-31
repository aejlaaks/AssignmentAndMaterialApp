using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services;

/// <summary>
/// Local file system implementation of IFileUploadHandler.
/// Follows the Single Responsibility Principle by focusing only on local file operations.
/// Follows the Open/Closed Principle by implementing IFileUploadHandler interface.
/// </summary>
public class LocalFileUploadHandler : IFileUploadHandler
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<LocalFileUploadHandler> _logger;
    private readonly string _uploadsFolder;

    public LocalFileUploadHandler(
        IWebHostEnvironment environment,
        ILogger<LocalFileUploadHandler> logger)
    {
        _environment = environment;
        _logger = logger;
        _uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");

        // Ensure uploads folder exists
        if (!Directory.Exists(_uploadsFolder))
        {
            Directory.CreateDirectory(_uploadsFolder);
            _logger.LogInformation($"Created uploads folder: {_uploadsFolder}");
        }
    }

    public async Task<FileUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            _logger.LogInformation($"Uploading file {fileName} to local file system");

            // Generate a unique file name
            var uniqueFileName = GenerateUniqueFileName(fileName);
            var filePath = Path.Combine(_uploadsFolder, uniqueFileName);

            // Create directory structure if needed
            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            // Write the file to disk
            using (var fileStreamWriter = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            {
                await fileStream.CopyToAsync(fileStreamWriter);
            }

            var fileSize = fileStream.Length;
            _logger.LogInformation($"File {fileName} uploaded successfully to {filePath}");

            // Return relative path from uploads folder
            var relativePath = Path.GetRelativePath(_uploadsFolder, filePath);

            return new FileUploadResult
            {
                Success = true,
                StoragePath = relativePath,
                FileSize = fileSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error uploading file {fileName} to local file system");
            return new FileUploadResult
            {
                Success = false,
                ErrorMessage = $"Failed to upload file: {ex.Message}"
            };
        }
    }

    public Task<bool> DeleteAsync(string storagePath)
    {
        try
        {
            var filePath = GetFullPath(storagePath);
            _logger.LogInformation($"Deleting file from local file system: {filePath}");

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogInformation($"File deleted successfully: {filePath}");
                return Task.FromResult(true);
            }

            _logger.LogWarning($"File not found: {filePath}");
            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting file from local file system: {storagePath}");
            return Task.FromResult(false);
        }
    }

    public Task<Stream?> GetFileAsync(string storagePath)
    {
        try
        {
            var filePath = GetFullPath(storagePath);
            _logger.LogInformation($"Retrieving file from local file system: {filePath}");

            if (File.Exists(filePath))
            {
                var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                return Task.FromResult<Stream?>(stream);
            }

            _logger.LogWarning($"File not found: {filePath}");
            return Task.FromResult<Stream?>(null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving file from local file system: {storagePath}");
            return Task.FromResult<Stream?>(null);
        }
    }

    public Task<bool> ExistsAsync(string storagePath)
    {
        try
        {
            var filePath = GetFullPath(storagePath);
            return Task.FromResult(File.Exists(filePath));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error checking if file exists in local file system: {storagePath}");
            return Task.FromResult(false);
        }
    }

    /// <summary>
    /// Generates a unique file name by prepending a timestamp
    /// </summary>
    private string GenerateUniqueFileName(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
        
        // Replace spaces and special characters
        fileNameWithoutExtension = fileNameWithoutExtension.Replace(" ", "_");
        
        // Generate unique name with timestamp
        return $"{DateTime.UtcNow.Ticks}_{fileNameWithoutExtension}{extension}";
    }

    /// <summary>
    /// Gets the full file path from a relative storage path
    /// </summary>
    private string GetFullPath(string storagePath)
    {
        // Remove leading slash if present
        storagePath = storagePath.TrimStart('/', '\\');
        
        // Combine with uploads folder
        return Path.Combine(_uploadsFolder, storagePath);
    }
}

