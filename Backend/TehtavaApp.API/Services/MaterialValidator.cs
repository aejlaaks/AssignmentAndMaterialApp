using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services;

/// <summary>
/// Implementation of IMaterialValidator.
/// Follows the Single Responsibility Principle by focusing only on validation logic.
/// Follows the Dependency Inversion Principle by depending on abstractions.
/// </summary>
public class MaterialValidator : IMaterialValidator
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<MaterialValidator> _logger;

    // Configuration constants
    private const long MaxFileSizeBytes = 100 * 1024 * 1024; // 100MB
    private static readonly string[] AllowedContentTypes = {
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/html",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };

    public MaterialValidator(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<MaterialValidator> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    public ValidationResult ValidateFileType(string contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return ValidationResult.Failure("Content type is required");
        }

        var normalizedContentType = contentType.ToLower().Trim();

        if (!AllowedContentTypes.Contains(normalizedContentType))
        {
            var allowedTypesString = string.Join(", ", AllowedContentTypes);
            return ValidationResult.Failure(
                $"Invalid file type '{contentType}'. Allowed types: {allowedTypesString}"
            );
        }

        return ValidationResult.Success();
    }

    public ValidationResult ValidateFileSize(long fileSize)
    {
        if (fileSize <= 0)
        {
            return ValidationResult.Failure("File size must be greater than 0");
        }

        if (fileSize > MaxFileSizeBytes)
        {
            var maxSizeMB = MaxFileSizeBytes / (1024 * 1024);
            return ValidationResult.Failure(
                $"File size ({fileSize / (1024 * 1024)}MB) exceeds maximum allowed size ({maxSizeMB}MB)"
            );
        }

        return ValidationResult.Success();
    }

    public async Task<ValidationResult> ValidateCreatePermissionAsync(string userId, int? courseId = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return ValidationResult.Failure("User ID is required");
        }

        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return ValidationResult.Failure("User not found");
            }

            // Check if user is teacher or admin
            var roles = await _userManager.GetRolesAsync(user);
            var isTeacherOrAdmin = roles.Contains("Teacher") || roles.Contains("Admin");

            if (!isTeacherOrAdmin)
            {
                return ValidationResult.Failure("Only teachers and admins can create materials");
            }

            // If courseId is provided, validate the user's permission for that course
            if (courseId.HasValue)
            {
                var hasPermission = await ValidateCoursePermissionAsync(userId, courseId.Value);
                if (!hasPermission.IsValid)
                {
                    return hasPermission;
                }
            }

            return ValidationResult.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error validating create permission for user {userId}");
            return ValidationResult.Failure("Error validating permissions");
        }
    }

    public async Task<ValidationResult> ValidateUpdatePermissionAsync(string userId, int materialId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return ValidationResult.Failure("User ID is required");
        }

        if (materialId <= 0)
        {
            return ValidationResult.Failure("Invalid material ID");
        }

        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return ValidationResult.Failure("User not found");
            }

            var material = await _context.Materials
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == materialId);

            if (material == null)
            {
                return ValidationResult.Failure("Material not found");
            }

            // Check if user is admin
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
            {
                return ValidationResult.Success();
            }

            // Check if user is the creator of the material
            if (material.CreatedById == userId)
            {
                return ValidationResult.Success();
            }

            // Check if user is a teacher of the course
            if (material.CourseId.HasValue)
            {
                var hasPermission = await ValidateCoursePermissionAsync(userId, material.CourseId.Value);
                if (hasPermission.IsValid)
                {
                    return ValidationResult.Success();
                }
            }

            return ValidationResult.Failure("You do not have permission to update this material");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error validating update permission for user {userId} and material {materialId}");
            return ValidationResult.Failure("Error validating permissions");
        }
    }

    public async Task<ValidationResult> ValidateDeletePermissionAsync(string userId, int materialId)
    {
        // Use the same logic as update permission
        return await ValidateUpdatePermissionAsync(userId, materialId);
    }

    public ValidationResult ValidateFileUpload(IFormFile file)
    {
        var errors = new List<string>();

        if (file == null)
        {
            return ValidationResult.Failure("File is required");
        }

        if (file.Length == 0)
        {
            errors.Add("File is empty");
        }

        // Validate file size
        var sizeValidation = ValidateFileSize(file.Length);
        if (!sizeValidation.IsValid)
        {
            errors.AddRange(sizeValidation.Errors);
        }

        // Validate content type
        var contentTypeValidation = ValidateFileType(file.ContentType);
        if (!contentTypeValidation.IsValid)
        {
            errors.AddRange(contentTypeValidation.Errors);
        }

        // Validate file name
        if (string.IsNullOrWhiteSpace(file.FileName))
        {
            errors.Add("File name is required");
        }

        if (errors.Any())
        {
            return ValidationResult.Failure(errors);
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validates if a user has permission to manage a course (teacher or admin)
    /// </summary>
    private async Task<ValidationResult> ValidateCoursePermissionAsync(string userId, int courseId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return ValidationResult.Failure("User not found");
            }

            // Check if user is admin
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
            {
                return ValidationResult.Success();
            }

            // Check if user is the main teacher of the course
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
            {
                return ValidationResult.Failure("Course not found");
            }

            if (course.TeacherId == userId)
            {
                return ValidationResult.Success();
            }

            // Check if user is an additional teacher of the course
            var isAdditionalTeacher = await _context.CourseTeachers
                .AnyAsync(ct => ct.CourseId == courseId && ct.TeacherId == userId);

            if (isAdditionalTeacher)
            {
                return ValidationResult.Success();
            }

            return ValidationResult.Failure("You do not have permission to manage this course");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error validating course permission for user {userId} and course {courseId}");
            return ValidationResult.Failure("Error validating course permissions");
        }
    }
}

