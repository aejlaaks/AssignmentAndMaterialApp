using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TehtavaApp.API.Services
{
    // Simple class to hold join table query results
    public class AssignmentMaterialJoin
    {
        public int AssignmentId { get; set; }
        public int MaterialId { get; set; }
    }
    
    /// <summary>
    /// Refactored MaterialService following SOLID principles.
    /// Now uses dependency injection for file upload, validation, and notification concerns.
    /// </summary>
    public class MaterialService : IMaterialService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileUploadHandler _fileUploadHandler;
        private readonly IMaterialValidator _materialValidator;
        private readonly IMaterialNotificationService _materialNotificationService;
        private readonly ILogger<MaterialService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly UserManager<ApplicationUser> _userManager;

        public MaterialService(
            ApplicationDbContext context,
            IFileUploadHandler fileUploadHandler,
            IMaterialValidator materialValidator,
            IMaterialNotificationService materialNotificationService,
            ILogger<MaterialService> logger,
            IServiceProvider serviceProvider,
            UserManager<ApplicationUser> userManager)
            {
            _context = context;
            _fileUploadHandler = fileUploadHandler;
            _materialValidator = materialValidator;
            _materialNotificationService = materialNotificationService;
            _logger = logger;
            _serviceProvider = serviceProvider;
            _userManager = userManager;
            }

        public async Task<Material> CreateMaterialAsync(Material material)
        {
            try
            {
                _logger.LogInformation($"Creating material: {material.Title}, CreatedById={material.CreatedById}");
                
                // Ensure no existing entity is being tracked
                var existingEntity = await _context.Materials.FirstOrDefaultAsync(m => 
                    m.Title == material.Title && 
                    m.CreatedById == material.CreatedById &&
                    m.CreatedAt.Date == material.CreatedAt.Date);
                
                if (existingEntity != null)
                {
                    _logger.LogWarning($"Similar material already exists with ID: {existingEntity.Id}, Title: {existingEntity.Title}");
                    _context.Entry(existingEntity).State = EntityState.Detached;
                }
                
                // Add new material entity
                _context.Materials.Add(material);
                
                // Save changes to get the ID
                var saveResult = await _context.SaveChangesAsync();
                _logger.LogInformation($"SaveChangesAsync result: {saveResult} changes, Material ID after save: {material.Id}");

                if (material.Id <= 0)
                {
                    _logger.LogError("Material was not assigned an ID after saving to database");
                    throw new ApplicationException("Material was not assigned an ID after saving to database");
                }

                // Reload the material from the database to ensure we have all navigation properties
                var refreshedMaterial = await _context.Materials
                    .Include(m => m.Course)
                    .Include(m => m.CreatedBy)
                    .FirstOrDefaultAsync(m => m.Id == material.Id);
                
                if (refreshedMaterial == null)
                {
                    _logger.LogError($"Could not retrieve saved material with ID {material.Id}");
                    throw new ApplicationException($"Could not retrieve saved material with ID {material.Id}");
                }
                
                _logger.LogInformation($"Successfully retrieved refreshed material, ID: {refreshedMaterial.Id}, Title: {refreshedMaterial.Title}");

                // Send notifications using the dedicated service
                await _materialNotificationService.NotifyMaterialCreatedAsync(refreshedMaterial);

                return refreshedMaterial;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in CreateMaterialAsync: {ex.Message}");
                throw;
            }
        }

        public async Task<Material> CreateMaterialAsync(Material material, IFormFile file)
        {
            try
            {
                if (file != null && file.Length > 0)
                {
                    _logger.LogInformation($"Creating material with file: {material.Title}, File: {file.FileName}");

                    // Validate file upload using the validator
                    var validationResult = _materialValidator.ValidateFileUpload(file);
                    if (!validationResult.IsValid)
                    {
                        throw new ApplicationException($"File validation failed: {validationResult.ErrorMessage}");
                    }

                    // Get file extension
                    var originalExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    var safeExtension = string.IsNullOrEmpty(originalExtension) || originalExtension.Length < 2 
                        ? ".bin" 
                        : originalExtension;
                    
                    // Create year/month based folder structure for the filename
                    var currentDate = DateTime.UtcNow;
                    var yearMonth = $"{currentDate.Year}/{currentDate:MM}";
                    var uniqueFileName = $"{yearMonth}/{Guid.NewGuid()}{safeExtension}";
                    
                    _logger.LogInformation($"Uploading file: {uniqueFileName}");

                    // Upload file using the file upload handler
                    using (var fileStream = file.OpenReadStream())
                    {
                        var uploadResult = await _fileUploadHandler.UploadAsync(fileStream, uniqueFileName, file.ContentType);
                        
                        if (!uploadResult.Success)
                        {
                            throw new ApplicationException($"Failed to upload file: {uploadResult.ErrorMessage}");
                        }
                        
                        // Update material properties
                        material.FileUrl = uploadResult.StoragePath;
                        material.FileType = file.ContentType;
                        material.FileSize = uploadResult.FileSize;
                        material.Type = GetMaterialType(file.FileName);
                        material.ContentType = file.ContentType;
                        
                        _logger.LogInformation($"File uploaded successfully to: {uploadResult.StoragePath}");
                    }
                    
                    // Ensure Content is not null
                    if (material.Content == null)
                    {
                        material.Content = "";
                    }
                }

                // Save to database
                _logger.LogInformation($"Adding material with file to context: {material.Title}");
                _context.Materials.Add(material);
                
                var saveResult = await _context.SaveChangesAsync();
                _logger.LogInformation($"SaveChangesAsync result: {saveResult} changes, Material ID: {material.Id}");

                if (material.Id <= 0)
                {
                    throw new ApplicationException("Material was not assigned an ID after saving to database");
                }

                // Send notifications using the dedicated service
                await _materialNotificationService.NotifyMaterialCreatedAsync(material);

                return material;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in CreateMaterialAsync with file: {ex.Message}");
                throw;
            }
        }

        private string GetMaterialType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => Material.MaterialType.PDF,
                ".html" => Material.MaterialType.Document,
                ".md" => Material.MaterialType.Document,
                ".txt" => Material.MaterialType.Text,
                ".doc" or ".docx" => Material.MaterialType.Document,
                ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => Material.MaterialType.Image,
                ".mp4" or ".avi" or ".mov" => Material.MaterialType.Video,
                ".mp3" or ".wav" => Material.MaterialType.Audio,
                _ => Material.MaterialType.Other
            };
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => Material.ContentTypes.PDF,
                ".txt" => Material.ContentTypes.PlainText,
                ".md" => Material.ContentTypes.Markdown,
                ".html" => Material.ContentTypes.HTML,
                _ => "application/octet-stream"
            };
        }

        public async Task<Material> GetMaterialByIdAsync(int id)
        {
            return await _context.Materials
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Material>> GetMaterialsByCourseIdAsync(int courseId)
        {
            _logger.LogInformation($"Getting materials for course {courseId}");
            
            try {
                var materials = await _context.Materials
                    .Where(m => m.CourseId == courseId)
                    .OrderByDescending(m => m.UpdatedAt)
                    .ToListAsync();
                
                _logger.LogInformation($"Found {materials.Count} materials for course {courseId}");
                
                return materials;
            }
            catch (Exception ex) {
                _logger.LogError(ex, $"Error getting materials for course {courseId}");
                throw;
            }
        }

        public async Task<Material> UpdateMaterialAsync(Material material)
        {
            var existingMaterial = await _context.Materials.FindAsync(material.Id);
            if (existingMaterial == null)
            {
                _logger.LogWarning($"Material with ID {material.Id} not found for update");
                return null;
            }

            _context.Entry(existingMaterial).CurrentValues.SetValues(material);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Material {material.Id} updated successfully");

            // Send notifications using the dedicated service
            await _materialNotificationService.NotifyMaterialUpdatedAsync(material);

            return material;
        }

        public async Task DeleteMaterialAsync(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == id);
                
            if (material == null)
            {
                _logger.LogWarning($"Material with ID {id} not found for deletion");
                return;
            }

            // Store course info for notifications before deletion
            var materialTitle = material.Title;
            var courseId = material.CourseId;

            try
            {
                // Delete the file using the file upload handler
                if (!string.IsNullOrEmpty(material.FileUrl))
                {
                    // If it's a full URL, we can't delete it directly
                    if (!material.FileUrl.StartsWith("http"))
                    {
                        _logger.LogInformation($"Deleting file from storage: {material.FileUrl}");
                        await _fileUploadHandler.DeleteAsync(material.FileUrl);
                    }
                    else
                    {
                        _logger.LogInformation($"Skipping deletion of external URL: {material.FileUrl}");
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but continue with database deletion
                _logger.LogError(ex, $"Error deleting file from storage: {ex.Message}");
            }

            // Remove the database entry
            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Material with ID {id} successfully removed from database");

            // Send notifications using the dedicated service
            await _materialNotificationService.NotifyMaterialDeletedAsync(id, materialTitle, courseId);
        }

        public async Task<bool> IsUserAuthorizedForMaterialAsync(string userId, int materialId)
        {
            var material = await _context.Materials
                .Include(m => m.Course)
                    .ThenInclude(c => c.Teacher)
                .FirstOrDefaultAsync(m => m.Id == materialId);

            if (material == null)
                return false;

            // Check if user is an admin (admins have access to all materials)
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
                return true;

            // If the user created the material, they are authorized
            if (material.CreatedById == userId)
                return true;

            // If the material has no course (global material), allow access
            if (material.Course == null)
                return true;

            // If the user is the teacher of the course, they are authorized
            if (material.Course.TeacherId == userId)
                return true;

            // If the user is enrolled in the course, they are authorized
            return await material.Course.HasStudentAsync(userId, _context);
        }

        public async Task<string> GetMaterialContentAsync(int materialId)
        {
            var material = await _context.Materials.FindAsync(materialId);
            return material?.Content;
        }

        public async Task UpdateMaterialContentAsync(int materialId, string content)
        {
            var material = await _context.Materials.FindAsync(materialId);
            if (material != null)
            {
                material.Content = content;
                material.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Material>> SearchMaterialsAsync(string searchTerm, string userId)
        {
            // Check if user is admin - admins can access all materials
            bool isAdmin = false;
            if (!string.IsNullOrEmpty(userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                isAdmin = user != null && await _userManager.IsInRoleAsync(user, "Admin");
            }

            // For admin users, don't filter by courses
            if (isAdmin)
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return await _context.Materials
                        .Include(m => m.Course)
                        .OrderByDescending(m => m.UpdatedAt)
                        .ToListAsync();
                }
                else
                {
                    return await _context.Materials
                        .Where(m => m.Title.Contains(searchTerm) ||
                                   m.Description.Contains(searchTerm) ||
                                   (m.Content != null && m.Content.Contains(searchTerm)))
                        .Include(m => m.Course)
                        .OrderByDescending(m => m.UpdatedAt)
                        .ToListAsync();
                }
            }

            // For non-admin users, continue with the existing logic
            var teachingCourses = await _context.Courses
                .Where(c => c.TeacherId == userId)
                .Select(c => (int?)c.Id)
                .ToListAsync();

            // Haetaan kurssit, joihin opiskelija on ilmoittautunut ryhmien kautta
            var enrolledCourses = await _context.StudentGroupEnrollments
                .Where(sge => sge.StudentId == userId && sge.Status == EnrollmentStatus.Active)
                .Join(_context.SchoolGroups, 
                      sge => sge.GroupId, 
                      g => g.Id, 
                      (sge, g) => g)
                .SelectMany(g => g.Courses.Select(c => (int?)c.Id))
                .Distinct()
                .ToListAsync();

            var userCourses = teachingCourses.Concat(enrolledCourses).Distinct();

            // If search term is empty, return all materials for the user's courses
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await _context.Materials
                    .Where(m => userCourses.Contains(m.CourseId))
                    .Include(m => m.Course)
                    .OrderByDescending(m => m.UpdatedAt)
                    .ToListAsync();
            }
            else
            {
                return await _context.Materials
                    .Where(m => userCourses.Contains(m.CourseId) &&
                               (m.Title.Contains(searchTerm) ||
                                m.Description.Contains(searchTerm) ||
                                (m.Content != null && m.Content.Contains(searchTerm))))
                    .Include(m => m.Course)
                    .OrderByDescending(m => m.UpdatedAt)
                    .ToListAsync();
            }
        }
    }
}
