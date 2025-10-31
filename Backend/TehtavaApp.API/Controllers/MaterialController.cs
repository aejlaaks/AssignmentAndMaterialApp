using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using System.Net.Http;
using Microsoft.Extensions.Logging;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;

namespace TehtavaApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MaterialController : BaseController
{
    private readonly IMaterialService _materialService;
    private readonly IUserService _userService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<MaterialController> _logger;

    public MaterialController(
        IMaterialService materialService,
        IUserService userService,
        IWebHostEnvironment environment,
        ILogger<MaterialController> logger)
    {
        _materialService = materialService;
        _userService = userService;
        _environment = environment;
        _logger = logger;
    }

    // DTO for material upload response
    public class MaterialUploadResponseDTO
    {
        public string? Id { get; set; }
        public string? Title { get; set; }
        public string? FileUrl { get; set; }
        public string? FileType { get; set; }
        public string? ContentType { get; set; }
        public long FileSize { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // File upload result
    private class FileUploadResult
    {
        public bool Success { get; set; }
        public string? StoragePath { get; set; }
        public string? ErrorMessage { get; set; }
    }

    // Method to upload file to storage
    private async Task<FileUploadResult> UploadFileToStorageAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            // Get the Azure Blob Storage service
            var blobStorageService = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
            
            // Generate a unique file name to prevent collisions
            var uniqueFileName = $"{DateTime.UtcNow.Ticks}_{fileName.Replace(" ", "_")}";
            
            // Upload the file
            var result = await blobStorageService.UploadFileAsync(fileStream, uniqueFileName, contentType);
            
            return new FileUploadResult
            {
                Success = true,
                StoragePath = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error uploading file {fileName}: {ex.Message}");
            return new FileUploadResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    // Helper method to handle Azure Blob Storage URLs
    private async Task<ActionResult> HandleAzureBlobUrl(Material material, string url)
    {
        Console.WriteLine($"Detected Azure Blob Storage URL: {url}");
        
        // Extract just the filename from the URL
        string blobName = Path.GetFileName(url);
        Console.WriteLine($"Extracted blob name: {blobName}");
        
        // Get the file storage service
        var blobStorageService = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
        
        // Try to get the file using the extracted blob name in the materials folder
        var fixedPath = $"materials/{blobName}";
        Console.WriteLine($"Trying to access blob with path: {fixedPath}");
        
        var blobStream = await blobStorageService.GetFileAsync(fixedPath);
        
        if (blobStream != null)
        {
            // Update access count
            material.IncrementAccessCount();
            await _materialService.UpdateMaterialAsync(material);
            
            // Return file with proper MIME type
            var blobMimeType = string.IsNullOrEmpty(material.ContentType) 
                ? GetMimeType(material.FileUrl)
                : material.ContentType;
            
            Console.WriteLine($"Returning file with MIME type: {blobMimeType}");
            return File(blobStream, blobMimeType);
        }
        
        Console.WriteLine($"Could not find blob using extracted name: {blobName}");
        return NotFound($"File not found: {blobName}");
    }

    [HttpPost]
    [Authorize] // Remove the Teacher role requirement
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB limit
    [RequestFormLimits(MultipartBodyLengthLimit = 100 * 1024 * 1024)]
    public async Task<ActionResult<MaterialResponseDTO>> CreateMaterial([FromForm] MaterialCreateDTO dto, IFormFile? file)
    {
        try
        {
            if (file != null)
            {
                // Validate file type
                var allowedTypes = new[] { 
                    "application/pdf", "text/plain", "text/markdown", "text/html",
                    "image/jpeg", "image/png", "image/gif", "image/webp"
                };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return HandleBadRequest<MaterialResponseDTO>("Invalid file type. Only PDF, text, markdown, HTML, and common image formats (JPEG, PNG, GIF, WebP) are allowed.");
                }

                // Validate file size (50MB max)
                if (file.Length > 50 * 1024 * 1024)
                {
                    return HandleBadRequest<MaterialResponseDTO>("File size exceeds the 50MB limit.");
                }
            }

            var material = new Material
            {
                Title = dto.Title,
                Description = dto.Description,
                Type = file != null ? GetMaterialType(file.FileName) : dto.Type ?? "text",
                Content = dto.Content ?? "", // Set a default empty string if Content is null
                FileUrl = dto.FileUrl ?? "/api/default-placeholder", // Set default value for FileUrl
                FileType = file?.ContentType ?? dto.ContentType ?? "application/octet-stream", // Ensure FileType is not null
                ContentType = file?.ContentType ?? dto.ContentType ?? "application/octet-stream", // Ensure ContentType is not null
                FilePath = dto.FileUrl ?? file?.FileName ?? "/materials/default", // Set default value for FilePath
                CourseId = dto.CourseId != null ? int.Parse(dto.CourseId) : null,
                CreatedById = UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Log the material being created
            Console.WriteLine($"Creating material: Title={material.Title}, CourseId={material.CourseId}, Content={material.Content?.Length ?? 0} chars");

            var result = file != null 
                ? await _materialService.CreateMaterialAsync(material, file)
                : await _materialService.CreateMaterialAsync(material);

            if (result == null || result.Id <= 0)
            {
                Console.WriteLine("Error: Material creation failed - no valid ID returned");
                return HandleServerError<MaterialResponseDTO>("Failed to create material - database operation failed");
            }

            Console.WriteLine($"Material created successfully with ID: {result.Id}");
            
            var responseDto = MapToResponseDTO(result);
            Console.WriteLine($"Mapped response DTO with ID: {responseDto.Id}");
            
            return HandleCreated(responseDto, nameof(GetMaterial), new { id = result.Id.ToString() });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateMaterial: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return HandleError<MaterialResponseDTO>(ex);
        }
    }

    [HttpPost("json")]
    [Authorize]
    public async Task<ActionResult<MaterialResponseDTO>> CreateMaterialJson([FromBody] MaterialCreateDTO dto)
    {
        try
        {
            Console.WriteLine($"Creating material via JSON endpoint: Title={dto.Title}, CourseId={dto.CourseId}");
            
            int? parsedCourseId = null;
            if (dto.CourseId != null)
            {
                if (int.TryParse(dto.CourseId, out int courseId))
                {
                    parsedCourseId = courseId;
                    Console.WriteLine($"Successfully parsed CourseId {dto.CourseId} to integer value {parsedCourseId}");
                }
                else
                {
                    Console.WriteLine($"Failed to parse CourseId {dto.CourseId} to integer - will not associate with course");
                    parsedCourseId = null;
                }
            }
            
            var material = new Material
            {
                Title = dto.Title,
                Description = dto.Description,
                Type = dto.Type ?? "text",
                Content = dto.Content ?? "", // Set a default empty string if Content is null
                FileUrl = dto.FileUrl ?? "/api/default-placeholder", // Set default value for FileUrl to prevent NULL error
                FileType = dto.ContentType ?? "application/octet-stream", // Ensure FileType is not null
                ContentType = dto.ContentType ?? "application/octet-stream", // Ensure ContentType is not null
                FilePath = dto.FileUrl ?? "/materials/default", // Set default value for FilePath to prevent NULL error
                CourseId = parsedCourseId,
                CreatedById = UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Log the material being created
            Console.WriteLine($"Creating material: Title={material.Title}, CourseId={material.CourseId}, UserID={UserId}, ContentType={material.ContentType}, FilePath={material.FilePath}, Content={material.Content?.Length ?? 0} chars");

            var result = await _materialService.CreateMaterialAsync(material);

            if (result == null)
            {
                Console.WriteLine("Error: Material creation failed - service returned null");
                return HandleServerError<MaterialResponseDTO>("Failed to create material - database operation failed");
            }
            
            if (result.Id <= 0)
            {
                Console.WriteLine($"Error: Material creation failed - invalid ID returned: {result.Id}");
                return HandleServerError<MaterialResponseDTO>("Failed to create material - database operation failed");
            }

            Console.WriteLine($"Material created successfully with ID: {result.Id}, created by: {result.CreatedById}");
            
            var responseDto = MapToResponseDTO(result);
            
            if (responseDto == null)
            {
                Console.WriteLine("Error: Failed to map material to response DTO");
                return HandleServerError<MaterialResponseDTO>("Failed to create response DTO");
            }
            
            Console.WriteLine($"Mapped response DTO with ID: {responseDto.Id}");
            Console.WriteLine($"Returning material with CreatedAtAction: Controller={nameof(MaterialController)}, Action={nameof(GetMaterial)}, RouteValues={{ id = {result.Id.ToString()} }}");
            
            // Return created response with the correct route
            return HandleCreated(responseDto, nameof(GetMaterial), new { id = result.Id.ToString() });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateMaterialJson: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return HandleError<MaterialResponseDTO>(ex);
        }
    }

    private string GetMaterialType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return extension switch
        {
            ".pdf" => "PDF",
            ".md" => "Markdown",
            ".html" => "HTML",
            ".txt" => "Text",
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => "Image",
            _ => "Document"
        };
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaterialResponseDTO>> GetMaterial(string id)
    {
        try
        {
            var materialId = int.Parse(id);
            var material = await _materialService.GetMaterialByIdAsync(materialId);
            if (material == null)
                return HandleNotFound<MaterialResponseDTO>();

            var isAuthorized = await _materialService.IsUserAuthorizedForMaterialAsync(UserId, materialId);
            if (!isAuthorized)
                return HandleForbidden<MaterialResponseDTO>();

            return HandleResult(MapToResponseDTO(material));
        }
        catch (Exception ex)
        {
            return HandleError<MaterialResponseDTO>(ex);
        }
    }

    [HttpGet("course/{courseId}")]
    public async Task<ActionResult<IEnumerable<MaterialListItemDTO>>> GetCourseMaterials(string courseId)
    {
        try
        {
            Console.WriteLine($"GetCourseMaterials called with courseId: {courseId}");
            int parsedCourseId;
            if (!int.TryParse(courseId, out parsedCourseId))
            {
                Console.WriteLine($"Failed to parse courseId '{courseId}' as integer");
                return HandleBadRequest<IEnumerable<MaterialListItemDTO>>($"Invalid course ID format: {courseId}");
            }
            
            Console.WriteLine($"Fetching materials for course ID: {parsedCourseId}");
            var materials = await _materialService.GetMaterialsByCourseIdAsync(parsedCourseId);
            Console.WriteLine($"Found {materials.Count()} materials for course {parsedCourseId}");
            
            var result = materials.Select(MapToListItemDTO).ToList();
            return HandleListResult(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetCourseMaterials: {ex.Message}");
            return HandleErrorForList<MaterialListItemDTO>(ex);
        }
    }

    [HttpGet("{id}/content")]
    [AllowAnonymous]
    public async Task<ActionResult> GetMaterialContent(string id)
    {
        try
        {
            // Parse material ID
            if (!int.TryParse(id, out int materialId))
            {
                Console.WriteLine($"Invalid material ID format: {id}");
                return BadRequest("Invalid material ID format");
            }
            
            Console.WriteLine($"Fetching material with ID: {materialId}");
            
            // Get material
            var material = await _materialService.GetMaterialByIdAsync(materialId);
            if (material == null)
            {
                Console.WriteLine($"Material with ID {materialId} not found in database");
                return NotFound("Material not found");
            }
            
            if (string.IsNullOrEmpty(material.FileUrl))
            {
                Console.WriteLine($"Material with ID {materialId} found but has no FileUrl");
                return NotFound("Material has no file URL");
            }
            
            Console.WriteLine($"Material found: ID={materialId}, FileUrl={material.FileUrl}, Type={material.Type}");
            
            // Verify authorization for non-image materials
            if (!material.IsImage())
            {
                // Only check authorization if we have a user ID
                if (!string.IsNullOrEmpty(UserId))
                {
                    Console.WriteLine($"Checking authorization for user {UserId}");
                    var isAuthorized = await _materialService.IsUserAuthorizedForMaterialAsync(UserId, materialId);
                    if (!isAuthorized)
                    {
                        Console.WriteLine($"User {UserId} is not authorized to access material {materialId}");
                        return Forbid();
                    }
                    Console.WriteLine($"User {UserId} is authorized to access material {materialId}");
                }
                else
                {
                    // For anonymous users, check if the material is publicly accessible
                    // For now, we'll assume only course materials require authorization
                    if (material.CourseId.HasValue)
                    {
                        Console.WriteLine($"Anonymous user not allowed to access course material {materialId}");
                        return Forbid();
                    }
                    Console.WriteLine($"Anonymous user allowed to access non-course material {materialId}");
                }
            }

            // If material URL is a remote URL, redirect to it
            if (material.FileUrl.StartsWith("http"))
            {
                // Special handling for Azure Blob Storage URLs
                if (material.FileUrl.Contains("tehtavatblocproduction.blob.core.windows.net/uploads/materials/"))
                {
                    var result = await HandleAzureBlobUrl(material, material.FileUrl);
                    if (result != null)
                    {
                        return result;
                    }
                }
                
                Console.WriteLine($"Found remote URL, but will proxy content to avoid CORS issues: {material.FileUrl}");
                
                try {
                    // Create HttpClient to download the remote file
                    using var httpClient = new HttpClient();
                    var response = await httpClient.GetAsync(material.FileUrl);
                    
                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Failed to download remote file: {response.StatusCode} - {response.ReasonPhrase}");
                        return NotFound("Remote file could not be accessed");
                    }
                    
                    var contentStream = await response.Content.ReadAsStreamAsync();
                    var contentType = response.Content.Headers.ContentType?.ToString() ?? material.ContentType ?? "application/octet-stream";
                    
                    // Increment access count
                    material.IncrementAccessCount();
                    await _materialService.UpdateMaterialAsync(material);
                    
                    return File(contentStream, contentType);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error proxying remote file: {ex.Message}");
                    return StatusCode(500, "Error accessing remote file");
                }
            }
            
            // Get file from Azure Blob Storage
            var fileStorageService = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
            
            // Remove leading slash if present, as Azure Blob Storage paths don't use them
            var filePath = material.FileUrl;
            if (filePath.StartsWith("/"))
            {
                Console.WriteLine($"Removing leading slash from path: {filePath}");
                filePath = filePath.TrimStart('/');
            }
            
            // Get file content
            var fileStream = await fileStorageService.GetFileAsync(filePath);
            if (fileStream == null)
            {
                Console.WriteLine($"File not found in Azure Blob Storage: {filePath}");
                return NotFound("File not found in storage");
            }

            // Update access count
            material.IncrementAccessCount();
            await _materialService.UpdateMaterialAsync(material);

            // Return file with proper MIME type
            var mimeType = string.IsNullOrEmpty(material.ContentType) 
                ? GetMimeType(material.FileUrl)
                : material.ContentType;
            
            Console.WriteLine($"Returning file with MIME type: {mimeType}");
            return File(fileStream, mimeType);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetMaterialContent: {ex}");
            
            // Log extended details for troubleshooting in production
            Console.WriteLine($"Exception Type: {ex.GetType().Name}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
            
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                Console.WriteLine($"Inner Stack Trace: {ex.InnerException.StackTrace}");
            }
            
            return StatusCode(500, "Internal server error while processing material content. Please try again later or contact support if the issue persists.");
        }
    }

    private string GetMimeType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }

    [HttpGet("content")]
    [AllowAnonymous] // Allow access without authentication
    public async Task<ActionResult> GetMaterialContentByUrl([FromQuery] string? url)
    {
        try
        {
            if (string.IsNullOrEmpty(url))
                return BadRequest("URL parameter is required");

            Console.WriteLine($"Searching for material with URL: {url}");
            
            // Search for materials with matching URL
            var materials = await _materialService.SearchMaterialsAsync("", string.Empty);
            
            // Try to find material by URL match
            var material = materials.FirstOrDefault(m => 
                m.FileUrl != null && 
                (m.FileUrl.EndsWith(url) || m.FileUrl.Contains(url)));
            
            if (material == null)
            {
                Console.WriteLine($"No material found with URL: {url}");
                return NotFound();
            }
            
            Console.WriteLine($"Found material: {material.Id}, {material.Title}, URL: {material.FileUrl}");
            
            // Only allow access to images
            if (!material.IsImage())
            {
                Console.WriteLine($"Material is not an image: {material.Type}");
                return Forbid("Only images can be accessed through this endpoint");
            }

            if (string.IsNullOrEmpty(material.FileUrl))
            {
                Console.WriteLine("Material has no FileUrl");
                return NotFound("File not found");
            }

            // If material URL is a remote URL, redirect to it
            if (material.FileUrl.StartsWith("http"))
            {
                // Special handling for Azure Blob Storage URLs
                if (material.FileUrl.Contains("tehtavatblocproduction.blob.core.windows.net/uploads/materials/"))
                {
                    var result = await HandleAzureBlobUrl(material, material.FileUrl);
                    if (result != null)
                    {
                        return result;
                    }
                }
                
                Console.WriteLine($"Found remote URL, but will proxy content to avoid CORS issues: {material.FileUrl}");
                
                try {
                    // Create HttpClient to download the remote file
                    using var httpClient = new HttpClient();
                    var response = await httpClient.GetAsync(material.FileUrl);
                    
                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"Failed to download remote file: {response.StatusCode} - {response.ReasonPhrase}");
                        return NotFound("Remote file could not be accessed");
                    }
                    
                    var contentStream = await response.Content.ReadAsStreamAsync();
                    var contentType = response.Content.Headers.ContentType?.ToString() ?? material.ContentType ?? "application/octet-stream";
                    
                    // Increment access count
                    material.IncrementAccessCount();
                    await _materialService.UpdateMaterialAsync(material);
                    
                    return File(contentStream, contentType);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error proxying remote file: {ex.Message}");
                    return StatusCode(500, "Error accessing remote file");
                }
            }
            
            // Get file from Azure Blob Storage
            var fileStorageService = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
            
            // Remove leading slash if present, as Azure Blob Storage paths don't use them
            var filePath = material.FileUrl;
            if (filePath.StartsWith("/"))
            {
                Console.WriteLine($"Removing leading slash from path: {filePath}");
                filePath = filePath.TrimStart('/');
            }
            
            // Get file content
            var fileStream = await fileStorageService.GetFileAsync(filePath);
            if (fileStream == null)
            {
                Console.WriteLine($"File not found in Azure Blob Storage: {filePath}");
                return NotFound("File not found in storage");
            }

            // Increment access count
            material.IncrementAccessCount();
            await _materialService.UpdateMaterialAsync(material);

            // Return the file
            return File(fileStream, material.ContentType);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetMaterialContentByUrl: {ex.Message}");
            return HandleError(ex);
        }
    }

    [HttpGet("{id}/public-content")]
    [AllowAnonymous] // Allow access without authentication
    public async Task<ActionResult> GetPublicMaterialContent(string id)
    {
        try
        {
            // Try to parse as int first (for database IDs)
            if (int.TryParse(id, out int materialId))
            {
                var material = await _materialService.GetMaterialByIdAsync(materialId);
                if (material == null)
                    return NotFound();

                // Only allow public material or images to be accessed through this endpoint
                var isImage = material.IsImage();
                var isPublic = !material.CourseId.HasValue;
                
                if (!isImage && !isPublic)
                {
                    Console.WriteLine($"Material {materialId} is not public or an image: Type={material.Type}, CourseId={material.CourseId}");
                    return Forbid("Only public materials or images can be accessed through this endpoint");
                }

                if (string.IsNullOrEmpty(material.FileUrl))
                {
                    Console.WriteLine($"Material {materialId} has no FileUrl");
                    return NotFound("File not found");
                }

                // If material URL is a remote URL, redirect to it
                if (material.FileUrl.StartsWith("http"))
                {
                    // Special handling for Azure Blob Storage URLs
                    if (material.FileUrl.Contains("tehtavatblocproduction.blob.core.windows.net/uploads/materials/"))
                    {
                        var result = await HandleAzureBlobUrl(material, material.FileUrl);
                        if (result != null)
                        {
                            return result;
                        }
                    }
                    
                    Console.WriteLine($"Found remote URL, but will proxy content to avoid CORS issues: {material.FileUrl}");
                    
                    try {
                        // Create HttpClient to download the remote file
                        using var httpClient = new HttpClient();
                        var response = await httpClient.GetAsync(material.FileUrl);
                        
                        if (!response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"Failed to download remote file: {response.StatusCode} - {response.ReasonPhrase}");
                            return NotFound("Remote file could not be accessed");
                        }
                        
                        var contentStream = await response.Content.ReadAsStreamAsync();
                        var contentType = response.Content.Headers.ContentType?.ToString() ?? material.ContentType ?? "application/octet-stream";
                        
                        // Increment access count
                        material.IncrementAccessCount();
                        await _materialService.UpdateMaterialAsync(material);
                        
                        return File(contentStream, contentType);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error proxying remote file: {ex.Message}");
                        return StatusCode(500, "Error accessing remote file");
                    }
                }
                
                // Get file from Azure Blob Storage
                var fileStorageService = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
                
                // Remove leading slash if present, as Azure Blob Storage paths don't use them
                var filePath = material.FileUrl;
                if (filePath.StartsWith("/"))
                {
                    Console.WriteLine($"Removing leading slash from path: {filePath}");
                    filePath = filePath.TrimStart('/');
                }
                
                // Get file content
                var fileStream = await fileStorageService.GetFileAsync(filePath);
                if (fileStream == null)
                {
                    Console.WriteLine($"File not found in Azure Blob Storage: {filePath}");
                    return NotFound("File not found in storage");
                }
                
                // Increment access count
                material.IncrementAccessCount();
                await _materialService.UpdateMaterialAsync(material);

                // Return file with proper MIME type
                var mimeType = string.IsNullOrEmpty(material.ContentType) 
                    ? GetMimeType(material.FileUrl)
                    : material.ContentType;
                    
                return File(fileStream, mimeType);
            }
            // If ID is not a number, use it as a search term for the URL
            else
            {
                // Redirect to the content URL endpoint
                return RedirectToAction(nameof(GetMaterialContentByUrl), new { url = id });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetPublicMaterialContent: {ex.Message}");
            return HandleError(ex);
        }
    }

    [HttpPut("{id}")]
    [Authorize] // Allow any authenticated user, not just Teachers
    public async Task<ActionResult<MaterialResponseDTO>> UpdateMaterial(string id, MaterialUpdateDTO dto)
    {
        try
        {
            Console.WriteLine($"Update material request received for material {id}");
            Console.WriteLine($"Update data: Title={dto.Title}, Description={dto.Description?.Substring(0, Math.Min(20, dto.Description?.Length ?? 0))}..., CourseId={dto.CourseId ?? "null"}");
            
            if (!ModelState.IsValid)
            {
                foreach (var state in ModelState)
                {
                    Console.WriteLine($"Validation error for {state.Key}: {string.Join(", ", state.Value.Errors.Select(e => e.ErrorMessage))}");
                }
                
                Console.WriteLine("ModelState is invalid, returning BadRequest");
                return BadRequest(ModelState);
            }
            
            if (id != dto.Id)
            {
                Console.WriteLine($"ID mismatch: URL ID={id}, DTO ID={dto.Id}");
                return HandleBadRequest<MaterialResponseDTO>("ID mismatch");
            }

            var materialId = int.Parse(id);
            var material = await _materialService.GetMaterialByIdAsync(materialId);
            
            if (material == null)
            {
                Console.WriteLine($"Material with ID {materialId} not found");
                return HandleNotFound<MaterialResponseDTO>();
            }

            // Add security check - only teachers/admins or the material creator can update it
            if (!IsTeacher && material.CreatedById != UserId)
            {
                Console.WriteLine($"User {UserId} attempted to update material {materialId} but is not the creator or a teacher");
                return HandleForbidden<MaterialResponseDTO>();
            }

            material.Title = dto.Title;
            material.Description = dto.Description;
            if (dto.Content != null) material.Content = dto.Content;
            if (dto.Type != null) material.Type = dto.Type;
            if (dto.FileUrl != null) material.FileUrl = dto.FileUrl;
            if (dto.FileType != null) material.FileType = dto.FileType;
            if (dto.ContentType != null) material.ContentType = dto.ContentType;
            
            // Handle courseId parsing with better error handling
            if (dto.CourseId != null)
            {
                if (int.TryParse(dto.CourseId, out int courseId))
                {
                    Console.WriteLine($"Setting courseId from {material.CourseId} to {courseId}");
                    material.CourseId = courseId;
                }
                else
                {
                    Console.WriteLine($"Warning: Could not parse courseId '{dto.CourseId}' as integer - keeping original value {material.CourseId}");
                }
            }
            
            material.UpdatedAt = DateTime.UtcNow;
            
            Console.WriteLine($"Updating material {materialId} with data: FileUrl={material.FileUrl}, FileType={material.FileType}, ContentType={material.ContentType}, CourseId={material.CourseId}");

            var result = await _materialService.UpdateMaterialAsync(material);
            
            if (result == null)
            {
                Console.WriteLine($"Update failed for material {materialId} - null result returned");
                return HandleServerError<MaterialResponseDTO>("Failed to update material");
            }
            
            Console.WriteLine($"Material {materialId} updated successfully with CourseId={result.CourseId}");
            
            return HandleResult(MapToResponseDTO(result));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in UpdateMaterial: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return HandleError<MaterialResponseDTO>(ex);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult> DeleteMaterial(string id)
    {
        try
        {
            var materialId = int.Parse(id);
            var material = await _materialService.GetMaterialByIdAsync(materialId);
            if (material == null)
                return NotFound();

            await _materialService.DeleteMaterialAsync(materialId);
            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<MaterialSearchResultDTO>>> SearchMaterials([FromQuery] string? searchTerm = "")
    {
        try
        {
            // Allow empty search term to return all materials
            if (string.IsNullOrWhiteSpace(searchTerm))
                searchTerm = "";

            var materials = await _materialService.SearchMaterialsAsync(searchTerm, UserId);
            var searchResults = materials.Select(m => new MaterialSearchResultDTO
            {
                Id = m.Id.ToString(),
                Title = m.Title,
                Description = m.Description,
                Type = m.Type,
                CreatedById = m.CreatedById,
                CreatedByName = m.CreatedBy?.FirstName + " " + m.CreatedBy?.LastName,
                CourseId = m.CourseId?.ToString(),
                CourseName = m.Course?.Name ?? string.Empty,
                CreatedAt = m.CreatedAt,
                RelevanceScore = CalculateRelevance(m, searchTerm),
                Relevance = CalculateRelevance(m, searchTerm)
            }).ToList();

            return HandleListResult(searchResults);
        }
        catch (Exception ex)
        {
            return HandleErrorForList<MaterialSearchResultDTO>(ex);
        }
    }

    private static MaterialResponseDTO MapToResponseDTO(Material material)
    {
        return new MaterialResponseDTO
        {
            Id = material.Id.ToString(),
            Title = material.Title,
            Description = material.Description,
            Type = material.Type,
            FileUrl = material.FileUrl,
            ContentType = material.ContentType,
            CreatedById = material.CreatedById,
            CreatedByName = material.CreatedBy?.FirstName + " " + material.CreatedBy?.LastName,
            CourseId = material.CourseId?.ToString(),
            CourseName = material.Course?.Name,
            Content = material.Content,
            CreatedAt = material.CreatedAt,
            UpdatedAt = material.UpdatedAt
        };
    }

    private static MaterialListItemDTO MapToListItemDTO(Material material) => new()
    {
        Id = material.Id.ToString(),
        Title = material.Title,
        Description = material.Description,
        Type = material.Type,
        FileUrl = material.FileUrl,
        FileType = material.FileType,
        CreatedById = material.CreatedById,
        CreatedByName = material.CreatedBy?.FirstName + " " + material.CreatedBy?.LastName,
        CreatedAt = material.CreatedAt,
        AccessCount = material.AccessCount
    };

    private static double CalculateRelevance(Material material, string searchTerm)
    {
        var relevance = 0.0;
        searchTerm = searchTerm.ToLower();

        // Title match has highest weight
        if (material.Title.ToLower().Contains(searchTerm))
            relevance += 3.0;

        // Description match has medium weight
        if (material.Description?.ToLower().Contains(searchTerm) == true)
            relevance += 2.0;

        // Content match has lowest weight
        if (material.Content?.ToLower().Contains(searchTerm) == true)
            relevance += 1.0;

        return relevance;
    }
}
