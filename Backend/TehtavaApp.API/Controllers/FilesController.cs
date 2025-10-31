using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using System.Linq;
using Microsoft.EntityFrameworkCore;
// Remove MongoDB dependency
// using MongoDB.Bson;

namespace TehtavaApp.API.Controllers
{
    [ApiController]
    [Route("api/files")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<FilesController> _logger;
        private readonly IConfiguration _configuration;

        public FilesController(
            IFileStorageService fileStorageService,
            ILogger<FilesController> logger,
            IConfiguration configuration)
        {
            _fileStorageService = fileStorageService;
            _logger = logger;
            _configuration = configuration;
        }

        // Helper method to handle Azure Blob Storage URLs
        private async Task<IActionResult> HandleAzureBlobUrl(UploadedFile file, string url)
        {
            _logger.LogInformation($"Detected Azure Blob Storage URL: {url}");
            
            // Extract just the filename from the URL
            string blobName = Path.GetFileName(url);
            _logger.LogInformation($"Extracted blob name: {blobName}");
            
            // Try to get the file using the extracted blob name in the appropriate folder
            string folder = file.Folder ?? "general";
            var fixedPath = $"{folder}/{blobName}";
            _logger.LogInformation($"Trying to access blob with path: {fixedPath}");
            
            var blobStream = await _fileStorageService.GetFileAsync(fixedPath);
            
            if (blobStream != null)
            {
                _logger.LogInformation($"Successfully retrieved blob with path: {fixedPath}");
                return File(blobStream, file.FileType, file.OriginalFileName);
            }
            
            _logger.LogWarning($"Could not find blob using extracted name: {blobName}");
            return NotFound($"File not found: {blobName}");
        }

        [HttpPost("upload")]
        public async Task<ActionResult<UploadedFile>> UploadFile(
            IFormFile file, 
            [FromForm] string folder = "general", 
            [FromForm] int? assignmentId = null,
            [FromForm] int? materialId = null,
            [FromForm] string? courseId = null)
        {
            try
            {
                _logger.LogInformation($"Received file upload request. File: {file?.FileName}, Size: {file?.Length}, Folder: {folder}, AssignmentId: {assignmentId?.ToString() ?? "null"}, MaterialId: {materialId?.ToString() ?? "null"}, CourseId: {courseId ?? "null"}");
                
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("No file was uploaded or file is empty");
                    return BadRequest("No file was uploaded");
                }

                // Validate file size
                var maxFileSizeBytes = _configuration.GetValue<int>("FileStorage:MaxFileSizeBytes", 10 * 1024 * 1024);
                if (file.Length > maxFileSizeBytes)
                {
                    var maxFileSizeMb = maxFileSizeBytes / (1024 * 1024);
                    _logger.LogWarning($"File size ({file.Length} bytes) exceeds the maximum allowed size of {maxFileSizeMb}MB");
                    return BadRequest($"File size exceeds the maximum allowed size of {maxFileSizeMb}MB");
                }

                // Validate file type
                var allowedExtensions = _configuration.GetSection("FileStorage:AllowedExtensions").Get<string[]>() ?? 
                    new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt" };
                
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    _logger.LogWarning($"File type {fileExtension} is not allowed");
                    return BadRequest($"File type {fileExtension} is not allowed");
                }

                // If courseId is provided but no assignmentId or materialId, use it to determine the folder
                if (!string.IsNullOrEmpty(courseId) && assignmentId == null && materialId == null)
                {
                    // Modify folder to include course information
                    folder = $"courses/{courseId}/{folder}";
                    _logger.LogInformation($"Using course-specific folder: {folder}");
                }

                // Sanitize folder name
                folder = SanitizeFolderName(folder);
                _logger.LogInformation($"Sanitized folder name: {folder}");

                // Create a unique filename
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                _logger.LogInformation($"Generated unique filename: {fileName}");

                // Read file into memory
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                _logger.LogInformation($"File copied to memory stream. Size: {memoryStream.Length} bytes");

                // Upload file to storage
                _logger.LogInformation("Calling FileStorageService.UploadFileWithMetadataAsync");
                var uploadedFile = await _fileStorageService.UploadFileWithMetadataAsync(
                    memoryStream, 
                    fileName, 
                    file.ContentType, 
                    folder, 
                    file.FileName);

                // If assignmentId is provided, associate the file with the assignment
                if (assignmentId.HasValue)
                {
                    uploadedFile.AssignmentId = assignmentId.Value;
                    _logger.LogInformation($"File associated with assignment ID: {assignmentId.Value}");
                    
                    // Note: we don't need to set CourseId as it will be accessed through the Assignment
                }
                
                // If materialId is provided, associate the file with the material
                if (materialId.HasValue)
                {
                    uploadedFile.MaterialId = materialId.Value;
                    _logger.LogInformation($"File associated with material ID: {materialId.Value}");
                    
                    // Note: we don't need to set CourseId as it will be accessed through the Material
                }

                // Update the file with any associations
                if (assignmentId.HasValue || materialId.HasValue)
                {
                    await _fileStorageService.UpdateFileAsync(uploadedFile);
                    _logger.LogInformation("File metadata updated with associations");
                }
                
                _logger.LogInformation($"File uploaded successfully. ID: {uploadedFile.Id}, URL: {uploadedFile.FileUrl}");

                return Ok(uploadedFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading file: {ex.Message}");
                if (ex.InnerException != null)
                {
                    _logger.LogError($"Inner exception: {ex.InnerException.Message}");
                }
                
                // Check for specific error types
                if (ex is InvalidOperationException && ex.Message.Contains("ConnectionString"))
                {
                    _logger.LogError("Database connection string error detected");
                    return StatusCode(500, "Database connection error. Please contact the administrator.");
                }
                
                if (ex is DbUpdateException || ex.InnerException is DbUpdateException)
                {
                    _logger.LogError("Database update error detected");
                    return StatusCode(500, "Database error while saving file information. Please contact the administrator.");
                }
                
                return StatusCode(500, "An error occurred while uploading the file");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UploadedFile>> GetFile(string id)
        {
            try
            {
                var file = await _fileStorageService.GetFileByIdAsync(id);
                if (file == null)
                {
                    return NotFound($"File with ID {id} not found");
                }

                return Ok(file);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving file with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the file");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteFile(string id)
        {
            try
            {
                var result = await _fileStorageService.DeleteFileByIdAsync(id);
                if (!result)
                {
                    return NotFound($"File with ID {id} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file with ID {id}");
                return StatusCode(500, "An error occurred while deleting the file");
            }
        }

        [HttpGet("submission/{submissionId}")]
        public async Task<ActionResult<IEnumerable<UploadedFile>>> GetFilesBySubmission(string submissionId)
        {
            try
            {
                var files = await _fileStorageService.GetFilesBySubmissionAsync(submissionId);
                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving files for submission {submissionId}");
                return StatusCode(500, "An error occurred while retrieving the files");
            }
        }

        [HttpGet("folder/{folder}")]
        public async Task<ActionResult<IEnumerable<UploadedFile>>> GetFilesByFolder(string folder)
        {
            try
            {
                // Sanitize folder name
                folder = SanitizeFolderName(folder);
                
                var files = await _fileStorageService.GetFilesByFolderAsync(folder);
                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving files for folder {folder}");
                return StatusCode(500, "An error occurred while retrieving the files");
            }
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadFile(string id)
        {
            try
            {
                var file = await _fileStorageService.GetFileByIdAsync(id);
                if (file == null)
                {
                    return NotFound($"File with ID {id} not found");
                }

                // If file is stored in Azure Blob Storage and has a direct URL
                if (file.IsStoredInCloud && !string.IsNullOrEmpty(file.FileUrl) && file.FileUrl.StartsWith("http"))
                {
                    // Special handling for Azure Blob Storage URLs
                    if (file.FileUrl.Contains("tehtavatblocproduction.blob.core.windows.net"))
                    {
                        var result = await HandleAzureBlobUrl(file, file.FileUrl);
                        if (result != null)
                        {
                            return result;
                        }
                    }
                    
                    // For other remote URLs, redirect to the direct URL
                    _logger.LogInformation($"Redirecting to remote URL: {file.FileUrl}");
                    return Redirect(file.FileUrl);
                }

                // Get file from storage service
                Stream fileStream;
                
                if (file.IsStoredInCloud && !string.IsNullOrEmpty(file.Path))
                {
                    // Get from Azure Blob Storage by path
                    fileStream = await _fileStorageService.GetFileAsync(file.Path);
                }
                else if (!string.IsNullOrEmpty(file.FileName))
                {
                    // Get by filename
                    fileStream = await _fileStorageService.GetFileAsync(file.FileName);
                }
                else
                {
                    return NotFound($"File content not found for {file.OriginalFileName}");
                }
                
                if (fileStream == null)
                {
                    return NotFound($"File content not found in storage");
                }

                return File(fileStream, file.FileType, file.OriginalFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error downloading file with ID {id}");
                return StatusCode(500, "An error occurred while downloading the file");
            }
        }

        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<IEnumerable<UploadedFile>>> GetFilesByAssignment(int assignmentId)
        {
            try
            {
                _logger.LogInformation($"Fetching files for assignment: {assignmentId}");
                var files = await _fileStorageService.GetFilesByAssignmentAsync(assignmentId);
                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving files for assignment {assignmentId}");
                return StatusCode(500, "An error occurred while retrieving the files");
            }
        }

        [HttpPost("bulk-upload/{courseId}")]
        public async Task<ActionResult<IEnumerable<UploadedFile>>> BulkUpload(string courseId, IFormFileCollection files)
        {
            try
            {
                if (files == null || files.Count == 0)
                {
                    return BadRequest("No files were uploaded");
                }

                _logger.LogInformation($"Received bulk upload request for course {courseId}. Files count: {files?.Count ?? 0}");

                var uploadedFiles = new List<UploadedFile>();

                // Create a folder structure for the course
                var folder = $"courses/{courseId}/materials";
                
                foreach (var file in files)
                {
                    try
                    {
                        if (file.Length == 0)
                        {
                            _logger.LogWarning($"Empty file skipped: {file.FileName}");
                            continue;
                        }

                        // Generate a unique filename
                        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                        var fileName = $"{Guid.NewGuid()}{fileExtension}";

                        // Upload file to storage
                        using var stream = file.OpenReadStream();
                        var uploadedFile = await _fileStorageService.UploadFileWithMetadataAsync(
                            stream,
                            fileName,
                            file.ContentType,
                            folder,
                            file.FileName);

                        // We'll associate the file with the course through the folder structure
                        // and potentially link it to a material later
                        
                        // Note: We're no longer setting CourseId directly as it's been removed
                        
                        uploadedFiles.Add(uploadedFile);
                        
                        _logger.LogInformation($"Successfully uploaded file: {file.FileName}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error uploading file {file.FileName}: {ex.Message}");
                        // Continue with other files
                    }
                }

                if (uploadedFiles.Count == 0)
                {
                    return BadRequest("No files were successfully uploaded");
                }

                return Ok(uploadedFiles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading files for course {courseId}");
                return StatusCode(500, "An error occurred while uploading the files");
            }
        }

        [HttpGet("diagnostics/assignments/{assignmentId}")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetAssignmentFileDiagnostics(string assignmentId)
        {
            _logger.LogInformation($"Running file diagnostics for assignment {assignmentId}");
            
            try 
            {
                var results = new Dictionary<string, object>();
                
                // 1. Try direct assignment lookup with string parameter
                var directAssignmentFiles = await _fileStorageService.GetFilesByAssignmentAsync(assignmentId);
                results["directAssignmentFiles"] = new 
                {
                    count = directAssignmentFiles.Count(),
                    files = directAssignmentFiles.Select(f => new 
                    {
                        id = f.Id,
                        fileName = f.FileName,
                        originalFileName = f.OriginalFileName,
                        assignmentId = f.AssignmentId,
                        uploadedAt = f.UploadedAt
                    }).ToList()
                };
                
                // 2. Check for file naming patterns
                var allAssignmentFolderFiles = await _fileStorageService.GetFilesByFolderAsync("assignments");
                
                var patternMatches = new Dictionary<string, object>();
                
                // Pattern 1: Files that contain the assignment title
                var pattern1Files = new List<UploadedFile>();
                pattern1Files = allAssignmentFolderFiles
                    .Where(f => f.FileName.Contains($"assignment-{assignmentId}"))
                    .ToList();
                    
                patternMatches["title_match"] = new
                {
                    count = pattern1Files.Count(),
                    files = pattern1Files.Select(f => new 
                    {
                        id = f.Id,
                        fileName = f.FileName,
                        uploadedAt = f.UploadedAt
                    }).ToList()
                };
                
                // Pattern 2: Files that match naming conventions
                var pattern2Files = new List<UploadedFile>();
                pattern2Files = allAssignmentFolderFiles
                    .Where(f => f.FileName.Contains($"assignment_{assignmentId}"))
                    .ToList();
                    
                patternMatches["naming_conventions"] = new
                {
                    count = pattern2Files.Count(),
                    files = pattern2Files.Select(f => new 
                    {
                        id = f.Id,
                        fileName = f.FileName,
                        uploadedAt = f.UploadedAt
                    }).ToList()
                };
                
                // Pattern 3: Files that have the ID somewhere in the filename
                var pattern3Files = new List<UploadedFile>();
                pattern3Files = allAssignmentFolderFiles
                    .Where(f => f.FileName.Contains(assignmentId))
                    .ToList();
                    
                patternMatches["id_in_filename"] = new
                {
                    count = pattern3Files.Count(),
                    files = pattern3Files.Select(f => new 
                    {
                        id = f.Id,
                        fileName = f.FileName,
                        uploadedAt = f.UploadedAt
                    }).ToList()
                };
                
                results["patternMatches"] = patternMatches;
                
                // 3. Database stats - Fix type mismatches here
                results["databaseStats"] = new
                {
                    totalAssignmentFolderFiles = allAssignmentFolderFiles.Count(),
                    totalWithAssignmentId = allAssignmentFolderFiles.Count(f => f.AssignmentId.HasValue),
                    thisAssignmentIdCount = int.TryParse(assignmentId, out int assignmentIdInt) 
                        ? allAssignmentFolderFiles.Count(f => f.AssignmentId == assignmentIdInt)
                        : 0,
                    fileFormats = allAssignmentFolderFiles
                        .Select(f => Path.GetExtension(f.FileName))
                        .Distinct()
                        .ToList()
                };
                
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error running diagnostics for assignment {assignmentId}");
                return StatusCode(500, $"Error running diagnostics: {ex.Message}");
            }
        }

        private string SanitizeFolderName(string folder)
        {
            // Remove any potentially dangerous characters
            var invalidChars = Path.GetInvalidPathChars().Concat(new[] { '/', '\\', ':', '*', '?', '"', '<', '>', '|' });
            return new string(folder.Where(c => !invalidChars.Contains(c)).ToArray()).ToLowerInvariant();
        }
    }
} 