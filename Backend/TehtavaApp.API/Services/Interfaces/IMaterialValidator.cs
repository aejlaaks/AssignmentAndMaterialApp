using Microsoft.AspNetCore.Http;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces;

/// <summary>
/// Abstraction for validating material-related operations.
/// Follows the Single Responsibility Principle by focusing only on validation logic.
/// Follows the Dependency Inversion Principle by depending on abstractions rather than concrete implementations.
/// </summary>
public interface IMaterialValidator
{
    /// <summary>
    /// Validates if the file type is allowed
    /// </summary>
    /// <param name="contentType">The MIME type of the file</param>
    /// <returns>Validation result</returns>
    ValidationResult ValidateFileType(string contentType);

    /// <summary>
    /// Validates if the file size is within limits
    /// </summary>
    /// <param name="fileSize">The size of the file in bytes</param>
    /// <returns>Validation result</returns>
    ValidationResult ValidateFileSize(long fileSize);

    /// <summary>
    /// Validates if a user has permission to create a material
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="courseId">The course ID (optional)</param>
    /// <returns>Validation result</returns>
    Task<ValidationResult> ValidateCreatePermissionAsync(string userId, int? courseId = null);

    /// <summary>
    /// Validates if a user has permission to update a material
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="materialId">The material ID</param>
    /// <returns>Validation result</returns>
    Task<ValidationResult> ValidateUpdatePermissionAsync(string userId, int materialId);

    /// <summary>
    /// Validates if a user has permission to delete a material
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="materialId">The material ID</param>
    /// <returns>Validation result</returns>
    Task<ValidationResult> ValidateDeletePermissionAsync(string userId, int materialId);

    /// <summary>
    /// Validates a complete file upload
    /// </summary>
    /// <param name="file">The file to validate</param>
    /// <returns>Validation result</returns>
    ValidationResult ValidateFileUpload(IFormFile file);
}

/// <summary>
/// Result of a validation operation
/// </summary>
public class ValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ValidationResult Success() => new() { IsValid = true };
    
    public static ValidationResult Failure(string errorMessage) => new() 
    { 
        IsValid = false, 
        ErrorMessage = errorMessage,
        Errors = new List<string> { errorMessage }
    };

    public static ValidationResult Failure(List<string> errors) => new()
    {
        IsValid = false,
        ErrorMessage = string.Join("; ", errors),
        Errors = errors
    };
}

