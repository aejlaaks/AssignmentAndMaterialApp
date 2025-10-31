using System.Collections.Generic;
using System.Threading.Tasks;
using TehtavaApp.API.DTOs;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface IAdminService
    {
        /// <summary>
        /// Retrieves all system settings.
        /// </summary>
        /// <returns>List of system settings.</returns>
        Task<IEnumerable<SystemSettingsDTO>> GetSystemSettingsAsync();

        /// <summary>
        /// Updates system settings.
        /// </summary>
        /// <param name="settingsDto">System settings data transfer object.</param>
        /// <returns>True if the update was successful; otherwise, false.</returns>
        Task<bool> UpdateSystemSettingsAsync(SystemSettingsDTO settingsDto);

        /// <summary>
        /// Retrieves the user activity report.
        /// </summary>
        /// <returns>User activity report.</returns>
        Task<UserActivityReportDTO> GetUserActivityReportAsync();

        /// <summary>
        /// Retrieves the course statistics report.
        /// </summary>
        /// <returns>Course statistics report.</returns>
        Task<CourseStatisticsReportDTO> GetCourseStatisticsReportAsync();
    }
}
