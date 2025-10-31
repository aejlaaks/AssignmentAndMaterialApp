using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services
{
    public class MaterialFileVerificationService
    {
        private readonly ILogger<MaterialFileVerificationService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IWebHostEnvironment _environment;

        public MaterialFileVerificationService(
            ILogger<MaterialFileVerificationService> logger,
            IServiceProvider serviceProvider,
            IWebHostEnvironment environment)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _environment = environment;
        }

        public async Task VerifyAndRepairFilesAsync()
        {
            _logger.LogInformation("Starting file system verification and repair process");
            
            // Create a scope to resolve scoped services like DbContext
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            // Get all materials with file URLs
            var materialsWithFiles = await dbContext.Materials
                .Where(m => !string.IsNullOrEmpty(m.FileUrl))
                .ToListAsync();
            
            _logger.LogInformation($"Found {materialsWithFiles.Count} materials with file URLs to verify");
            
            int repairedCount = 0;
            int missingCount = 0;
            
            foreach (var material in materialsWithFiles)
            {
                try
                {
                    var repaired = await VerifyAndRepairMaterialFileAsync(material, dbContext);
                    if (repaired)
                    {
                        repairedCount++;
                    }
                    else if (!FileExists(material))
                    {
                        missingCount++;
                        _logger.LogWarning($"Material ID {material.Id} file could not be found or repaired: {material.FileUrl}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error verifying material ID {material.Id}: {ex.Message}");
                }
            }
            
            _logger.LogInformation($"File verification complete: {repairedCount} files repaired, {missingCount} files missing");
        }
        
        private async Task<bool> VerifyAndRepairMaterialFileAsync(Material material, ApplicationDbContext dbContext)
        {
            // Check if file exists at current path
            if (FileExists(material))
            {
                _logger.LogDebug($"Material ID {material.Id} file exists at current path: {material.FileUrl}");
                return false; // No repair needed
            }
            
            _logger.LogInformation($"Material ID {material.Id} file not found at path: {material.FileUrl}");
            
            // Try to find the file by searching for the filename
            var fileName = Path.GetFileName(material.FileUrl);
            if (string.IsNullOrEmpty(fileName))
            {
                _logger.LogWarning($"Material ID {material.Id} has invalid file URL: {material.FileUrl}");
                return false;
            }
            
            // Search in the uploads directory
            var uploadsDirectory = Path.Combine(_environment.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsDirectory))
            {
                _logger.LogWarning($"Uploads directory does not exist: {uploadsDirectory}");
                return false;
            }
            
            var matchingFiles = Directory.GetFiles(uploadsDirectory, fileName, SearchOption.AllDirectories);
            if (matchingFiles.Length == 0)
            {
                // Try to find by GUID portion if file name contains a GUID
                var guidPortion = ExtractGuidPortion(fileName);
                if (!string.IsNullOrEmpty(guidPortion))
                {
                    var fileExtension = Path.GetExtension(fileName);
                    matchingFiles = Directory.GetFiles(
                        uploadsDirectory, 
                        $"*{guidPortion}*{fileExtension}", 
                        SearchOption.AllDirectories);
                }
            }
            
            if (matchingFiles.Length > 0)
            {
                var foundFilePath = matchingFiles[0];
                _logger.LogInformation($"Found material ID {material.Id} file at: {foundFilePath}");
                
                // Update the material record with the correct path
                var relativePath = foundFilePath.Replace(_environment.WebRootPath, "").Replace("\\", "/");
                if (!relativePath.StartsWith("/")) 
                    relativePath = "/" + relativePath;
                
                material.FileUrl = relativePath;
                material.FilePath = foundFilePath;
                
                await dbContext.SaveChangesAsync();
                _logger.LogInformation($"Updated material ID {material.Id} with corrected path: {relativePath}");
                return true;
            }
            
            return false;
        }
        
        private bool FileExists(Material material)
        {
            if (string.IsNullOrEmpty(material.FileUrl))
                return false;
                
            if (material.FileUrl.StartsWith("http"))
                return true; // Assume external URLs are valid
                
            // Try FilePath first if available
            if (!string.IsNullOrEmpty(material.FilePath) && File.Exists(material.FilePath))
                return true;
                
            // Try constructed path
            var relativePath = material.FileUrl.TrimStart('/');
            var filePath = Path.Combine(_environment.WebRootPath, relativePath);
            
            return File.Exists(filePath);
        }
        
        private string ExtractGuidPortion(string fileName)
        {
            // Simple extraction of potential GUID parts (assumes typical UUID pattern)
            var fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            
            // Look for a pattern that might be a GUID (at least 8 characters with hyphens)
            var parts = fileNameWithoutExt.Split('-');
            if (parts.Length >= 4)
            {
                // This is a simplified approach - if the filename is already GUID-like
                return fileNameWithoutExt;
            }
            
            return null;
        }
    }
} 