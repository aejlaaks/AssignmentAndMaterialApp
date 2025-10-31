using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Data;

namespace TehtavaApp.API.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;

        public AdminService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all system settings.
        /// </summary>
        /// <returns>List of system settings.</returns>
        public async Task<IEnumerable<SystemSettingsDTO>> GetSystemSettingsAsync()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            return settings.Select(s => new SystemSettingsDTO
            {
                SettingName = s.SettingName,
                SettingValue = s.SettingValue
            });
        }

        /// <summary>
        /// Updates system settings.
        /// </summary>
        /// <param name="settingsDto">System settings data transfer object.</param>
        /// <returns>True if the update was successful; otherwise, false.</returns>
        public async Task<bool> UpdateSystemSettingsAsync(SystemSettingsDTO settingsDto)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingName == settingsDto.SettingName);
            if (setting == null)
                return false;

            setting.SettingValue = settingsDto.SettingValue;
            _context.SystemSettings.Update(setting);
            return await _context.SaveChangesAsync() > 0;
        }

        /// <summary>
        /// Retrieves the user activity report.
        /// </summary>
        /// <returns>User activity report.</returns>
        public async Task<UserActivityReportDTO> GetUserActivityReportAsync()
        {
            // Implement actual logic to generate the user activity report
            // For demonstration, returning dummy data
            return new UserActivityReportDTO
            {
                UserId = "user123",
                UserName = "John Doe",
                ActiveCourses = 3,
                CompletedAssignments = 10,
                PendingAssignments = 2
            };
        }

        /// <summary>
        /// Retrieves the course statistics report.
        /// </summary>
        /// <returns>Course statistics report.</returns>
        public async Task<CourseStatisticsReportDTO> GetCourseStatisticsReportAsync()
        {
            // Implement actual logic to generate the course statistics report
            // For demonstration, returning dummy data
            return new CourseStatisticsReportDTO
            {
                CourseId = 1,
                CourseName = "Mathematics",
                EnrolledStudents = 30,
                CompletedAssignments = 25,
                PendingAssignments = 5
            };
        }
    }
}
