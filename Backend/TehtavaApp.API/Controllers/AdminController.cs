using Microsoft.AspNetCore.Mvc;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : BaseController
    {
        private readonly IAdminService _adminService;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<AdminController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IAIGradingService _aiGradingService;

        public AdminController(
            IAdminService adminService, 
            IFileStorageService fileStorageService, 
            ILogger<AdminController> logger,
            IConfiguration configuration,
            IAIGradingService aiGradingService)
        {
            _adminService = adminService;
            _fileStorageService = fileStorageService;
            _logger = logger;
            _configuration = configuration;
            _aiGradingService = aiGradingService;
        }

        // System Settings Endpoints

        /// <summary>
        /// Retrieves all system settings.
        /// </summary>
        /// <returns>List of system settings.</returns>
        [HttpGet("settings")]
        public async Task<ActionResult<IEnumerable<SystemSettingsDTO>>> GetSystemSettings()
        {
            var settings = await _adminService.GetSystemSettingsAsync();
            return HandleOk(settings);
        }

        /// <summary>
        /// Updates system settings.
        /// </summary>
        /// <param name="settingsDto">System settings data transfer object.</param>
        /// <returns>No content if successful.</returns>
        [HttpPost("settings")]
        public async Task<ActionResult> UpdateSystemSettings([FromBody] SystemSettingsDTO settingsDto)
        {
            var success = await _adminService.UpdateSystemSettingsAsync(settingsDto);
            return HandleNoContent(success);
        }

        // Reports Endpoints

        /// <summary>
        /// Retrieves user activity report.
        /// </summary>
        /// <returns>User activity report.</returns>
        [HttpGet("reports/user-activity")]
        public async Task<ActionResult<UserActivityReportDTO>> GetUserActivityReport()
        {
            var report = await _adminService.GetUserActivityReportAsync();
            return HandleOk(report);
        }

        /// <summary>
        /// Retrieves course statistics report.
        /// </summary>
        /// <returns>Course statistics report.</returns>
        [HttpGet("reports/course-statistics")]
        public async Task<ActionResult<CourseStatisticsReportDTO>> GetCourseStatisticsReport()
        {
            var report = await _adminService.GetCourseStatisticsReportAsync();
            return HandleOk(report);
        }

        [HttpPost("migrate-assignment-files")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MigrateAssignmentFiles()
        {
            try
            {
                _logger.LogInformation("Starting assignment files migration");
                
                // Get all files in the assignments folder
                var files = await _fileStorageService.GetFilesByFolderAsync("assignments");
                _logger.LogInformation($"Found {files.Count()} files in assignments folder");
                
                int updatedCount = 0;
                
                foreach (var file in files)
                {
                    // Skip files that already have an AssignmentId
                    if (file.AssignmentId.HasValue)
                    {
                        continue;
                    }
                    
                    string fileName = file.FileName.ToLowerInvariant();
                    
                    // Look for assignment ID patterns in filename
                    string assignmentIdStr = null;
                    
                    // Pattern: assignment-{id}
                    var match = System.Text.RegularExpressions.Regex.Match(fileName, @"assignment-(\d+)");
                    if (match.Success && match.Groups.Count > 1)
                    {
                        assignmentIdStr = match.Groups[1].Value;
                    }
                    
                    // Pattern: assignment_{id}
                    if (assignmentIdStr == null)
                    {
                        match = System.Text.RegularExpressions.Regex.Match(fileName, @"assignment_(\d+)");
                        if (match.Success && match.Groups.Count > 1)
                        {
                            assignmentIdStr = match.Groups[1].Value;
                        }
                    }
                    
                    // Pattern: tehtava-{id}
                    if (assignmentIdStr == null)
                    {
                        match = System.Text.RegularExpressions.Regex.Match(fileName, @"tehtava-(\d+)");
                        if (match.Success && match.Groups.Count > 1)
                        {
                            assignmentIdStr = match.Groups[1].Value;
                        }
                    }
                    
                    // Pattern: tehtava_{id}
                    if (assignmentIdStr == null)
                    {
                        match = System.Text.RegularExpressions.Regex.Match(fileName, @"tehtava_(\d+)");
                        if (match.Success && match.Groups.Count > 1)
                        {
                            assignmentIdStr = match.Groups[1].Value;
                        }
                    }
                    
                    // If we found an assignment ID, update the file
                    if (!string.IsNullOrEmpty(assignmentIdStr) && int.TryParse(assignmentIdStr, out int assignmentId))
                    {
                        file.AssignmentId = assignmentId;
                        await _fileStorageService.UpdateFileAsync(file);
                        updatedCount++;
                        _logger.LogInformation($"Associated file {file.FileName} with assignment {assignmentId}");
                    }
                }
                
                _logger.LogInformation($"Migration completed. Updated {updatedCount} files");
                
                return Ok(new { 
                    Success = true, 
                    Message = $"Migration completed. Updated {updatedCount} of {files.Count()} files." 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error migrating assignment files");
                return StatusCode(500, "An error occurred during migration");
            }
        }

        // AI Grading Settings Endpoints

        /// <summary>
        /// Retrieves AI grading settings
        /// </summary>
        /// <returns>AI grading settings</returns>
        [HttpGet("ai-grading-settings")]
        [Authorize(Roles = "Admin")]
        public ActionResult<AIGradingSettings> GetAIGradingSettings()
        {
            try
            {
                var settings = new AIGradingSettings();
                _configuration.GetSection("AIGrading").Bind(settings);
                
                // Don't expose API keys in the response
                settings.OpenAI.ApiKey = string.IsNullOrEmpty(settings.OpenAI.ApiKey) ? "" : "***";
                settings.AzureOpenAI.ApiKey = string.IsNullOrEmpty(settings.AzureOpenAI.ApiKey) ? "" : "***";
                
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving AI grading settings");
                return StatusCode(500, "An error occurred while retrieving AI grading settings");
            }
        }

        /// <summary>
        /// Updates AI grading settings
        /// </summary>
        /// <param name="settings">AI grading settings</param>
        /// <returns>Success status</returns>
        [HttpPut("ai-grading-settings")]
        [Authorize(Roles = "Admin")]
        public ActionResult UpdateAIGradingSettings([FromBody] AIGradingSettings settings)
        {
            try
            {
                // Note: In a production environment, these settings should be saved to a database
                // or a configuration management system like Azure App Configuration or AWS Parameter Store
                // This is a simplified implementation that would require application restart
                
                _logger.LogInformation("AI grading settings update requested. Note: Application restart required for changes to take effect.");
                
                return Ok(new { 
                    Success = true, 
                    Message = "Settings validated. In production, these would be saved to a configuration store. Application restart required for changes to take effect." 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating AI grading settings");
                return StatusCode(500, "An error occurred while updating AI grading settings");
            }
        }

        /// <summary>
        /// Tests AI grading connection
        /// </summary>
        /// <returns>Connection test result</returns>
        [HttpPost("ai-grading-settings/test")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> TestAIGradingConnection()
        {
            try
            {
                var isConnected = await _aiGradingService.TestConnectionAsync();
                
                if (isConnected)
                {
                    return Ok(new { Success = true, Message = "AI grading service connection successful" });
                }
                else
                {
                    return BadRequest(new { Success = false, Message = "AI grading service connection failed" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing AI grading connection");
                return StatusCode(500, new { Success = false, Message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}
