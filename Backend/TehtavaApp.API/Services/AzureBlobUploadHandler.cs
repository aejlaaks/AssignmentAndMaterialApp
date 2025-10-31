using Microsoft.Extensions.Logging;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services;

/// <summary>
/// Azure Blob Storage implementation of IFileUploadHandler.
/// Follows the Single Responsibility Principle by focusing only on Azure Blob operations.
/// Follows the Dependency Inversion Principle by depending on IFileStorageService abstraction.
/// </summary>
public class AzureBlobUploadHandler : IFileUploadHandler
{
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<AzureBlobUploadHandler> _logger;

    public AzureBlobUploadHandler(
        IFileStorageService fileStorageService,
        ILogger<AzureBlobUploadHandler> logger)
    {
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<FileUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            _logger.LogInformation($"Uploading file {fileName} to Azure Blob Storage");

            // Generate a unique file name to prevent collisions
            var uniqueFileName = GenerateUniqueFileName(fileName);

            // Upload the file using the storage service
            var storagePath = await _fileStorageService.UploadFileAsync(fileStream, uniqueFileName, contentType);

            // Get the file size
            var fileSize = fileStream.Length;

            _logger.LogInformation($"File {fileName} uploaded successfully to {storagePath}");

            return new FileUploadResult
            {
                Success = true,
                StoragePath = storagePath,
                FileSize = fileSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error uploading file {fileName} to Azure Blob Storage");
            return new FileUploadResult
            {
                Success = false,
                ErrorMessage = $"Failed to upload file: {ex.Message}"
            };
        }
    }

    public async Task<bool> DeleteAsync(string storagePath)
    {
        try
        {
            _logger.LogInformation($"Deleting file from Azure Blob Storage: {storagePath}");
            var result = await _fileStorageService.DeleteFileAsync(storagePath);
            
            if (result)
            {
                _logger.LogInformation($"File deleted successfully: {storagePath}");
            }
            else
            {
                _logger.LogWarning($"File not found or could not be deleted: {storagePath}");
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting file from Azure Blob Storage: {storagePath}");
            return false;
        }
    }

    public async Task<Stream?> GetFileAsync(string storagePath)
    {
        try
        {
            _logger.LogInformation($"Retrieving file from Azure Blob Storage: {storagePath}");
            var stream = await _fileStorageService.GetFileAsync(storagePath);

            if (stream == null)
            {
                _logger.LogWarning($"File not found in Azure Blob Storage: {storagePath}");
            }

            return stream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving file from Azure Blob Storage: {storagePath}");
            return null;
        }
    }

    public async Task<bool> ExistsAsync(string storagePath)
    {
        try
        {
            return await _fileStorageService.FileExistsAsync(storagePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error checking if file exists in Azure Blob Storage: {storagePath}");
            return false;
        }
    }

    /// <summary>
    /// Generates a unique file name by prepending a timestamp and GUID
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
}

