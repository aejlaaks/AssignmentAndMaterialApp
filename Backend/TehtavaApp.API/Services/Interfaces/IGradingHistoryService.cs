using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public interface IGradingHistoryService
    {
        Task<IEnumerable<GradingHistory>> GetGradingHistoryBySubmissionAsync(string submissionId);
        Task<IEnumerable<GradingHistory>> GetGradingHistoryByAssignmentAsync(string assignmentId);
        Task<IEnumerable<GradingHistory>> GetGradingHistoryByTeacherAsync(string teacherId);
        Task<bool> RevertToHistoryVersionAsync(string historyId);
        Task<GradingStatisticsDTO> GetGradingStatisticsAsync(GradingHistoryFilterDTO filters);
        Task<GradingHistory> CreateGradingHistoryAsync(GradingHistory history);
    }
} 