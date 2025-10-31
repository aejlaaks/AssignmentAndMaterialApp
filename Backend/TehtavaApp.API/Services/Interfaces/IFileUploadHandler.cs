using Microsoft.AspNetCore.Http;

namespace TehtavaApp.API.Services.Interfaces;

/// <summary>
/// Abstraction for handling file uploads to different storage providers.
/// Follows the Single Responsibility Principle by focusing only on file upload operations.
/// Follows the Open/Closed Principle by allowing new storage implementations without modifying existing code.
/// </summary>
public interface IFileUploadHandler
{
    /// <summary>
    /// Uploads a file to the storage provider
    /// </summary>
    /// <param name="fileStream">The file stream to upload</param>
    /// <param name="fileName">The original file name</param>
    /// <param name="contentType">The MIME type of the file</param>
    /// <returns>The storage path or URL of the uploaded file</returns>
    Task<FileUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType);

    /// <summary>
    /// Deletes a file from the storage provider
    /// </summary>
    /// <param name="storagePath">The storage path or URL of the file</param>
    Task<bool> DeleteAsync(string storagePath);

    /// <summary>
    /// Gets the file stream from storage
    /// </summary>
    /// <param name="storagePath">The storage path or URL of the file</param>
    Task<Stream?> GetFileAsync(string storagePath);

    /// <summary>
    /// Checks if a file exists in storage
    /// </summary>
    /// <param name="storagePath">The storage path or URL of the file</param>
    Task<bool> ExistsAsync(string storagePath);
}

/// <summary>
/// Result of a file upload operation
/// </summary>
public class FileUploadResult
{
    public bool Success { get; set; }
    public string? StoragePath { get; set; }
    public string? ErrorMessage { get; set; }
    public long FileSize { get; set; }
}

