using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;
using Backend.Models;
using Backend.DTOs;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class GradingHistoryService : IGradingHistoryService
    {
        private readonly IMongoCollection<GradingHistory> _gradingHistory;
        private readonly ISubmissionService _submissionService;
        private readonly ILogger<GradingHistoryService> _logger;

        public GradingHistoryService(
            IMongoClient mongoClient,
            ISubmissionService submissionService,
            ILogger<GradingHistoryService> logger)
        {
            var database = mongoClient.GetDatabase("tehtavaapp");
            _gradingHistory = database.GetCollection<GradingHistory>("gradingHistory");
            _submissionService = submissionService;
            _logger = logger;
        }

        public async Task<IEnumerable<GradingHistory>> GetGradingHistoryBySubmissionAsync(string submissionId)
        {
            try
            {
                return await _gradingHistory
                    .Find(h => h.SubmissionId == submissionId)
                    .SortByDescending(h => h.Timestamp)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading history for submission {SubmissionId}", submissionId);
                throw;
            }
        }

        public async Task<IEnumerable<GradingHistory>> GetGradingHistoryByAssignmentAsync(string assignmentId)
        {
            try
            {
                return await _gradingHistory
                    .Find(h => h.AssignmentId == assignmentId)
                    .SortByDescending(h => h.Timestamp)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading history for assignment {AssignmentId}", assignmentId);
                throw;
            }
        }

        public async Task<IEnumerable<GradingHistory>> GetGradingHistoryByTeacherAsync(string teacherId)
        {
            try
            {
                return await _gradingHistory
                    .Find(h => h.TeacherId == teacherId)
                    .SortByDescending(h => h.Timestamp)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading history for teacher {TeacherId}", teacherId);
                throw;
            }
        }

        public async Task<bool> RevertToHistoryVersionAsync(string historyId)
        {
            try
            {
                // Get the history entry
                var history = await _gradingHistory.Find(h => h.Id == historyId).FirstOrDefaultAsync();
                if (history == null)
                {
                    return false;
                }

                // Create a new history entry for the revert action
                var revertHistory = new GradingHistory
                {
                    SubmissionId = history.SubmissionId,
                    AssignmentId = history.AssignmentId,
                    StudentId = history.StudentId,
                    StudentName = history.StudentName,
                    TeacherId = history.TeacherId, // This should be the current user, but we're reusing for simplicity
                    TeacherName = history.TeacherName,
                    CourseId = history.CourseId,
                    CourseName = history.CourseName,
                    AssignmentTitle = history.AssignmentTitle,
                    Grade = history.Grade,
                    Feedback = history.Feedback,
                    RequiresRevision = history.RequiresRevision,
                    RevisionDueDate = history.RevisionDueDate,
                    Action = "reverted",
                    Timestamp = DateTime.UtcNow,
                    RubricId = history.RubricId,
                    RubricGrade = history.RubricGrade,
                    PreviousVersionId = historyId
                };

                await _gradingHistory.InsertOneAsync(revertHistory);

                // Update the submission with the reverted grade
                await _submissionService.GradeSubmissionAsync(history.SubmissionId, new GradeSubmissionDTO
                {
                    Grade = history.Grade ?? 0, // Use 0 as default if Grade is null
                    Feedback = history.Feedback,
                    RequiresRevision = history.RequiresRevision,
                    RevisionDueDate = history.RevisionDueDate
                });

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reverting to history version {HistoryId}", historyId);
                throw;
            }
        }

        public async Task<GradingStatisticsDTO> GetGradingStatisticsAsync(GradingHistoryFilterDTO filters)
        {
            try
            {
                var filterBuilder = Builders<GradingHistory>.Filter;
                var filter = filterBuilder.Empty;

                // Apply filters
                if (!string.IsNullOrEmpty(filters.TeacherId))
                {
                    filter = filter & filterBuilder.Eq(h => h.TeacherId, filters.TeacherId);
                }

                if (!string.IsNullOrEmpty(filters.AssignmentId))
                {
                    filter = filter & filterBuilder.Eq(h => h.AssignmentId, filters.AssignmentId);
                }

                if (!string.IsNullOrEmpty(filters.CourseId))
                {
                    filter = filter & filterBuilder.Eq(h => h.CourseId, filters.CourseId);
                }

                if (filters.StartDate.HasValue)
                {
                    filter = filter & filterBuilder.Gte(h => h.Timestamp, filters.StartDate.Value);
                }

                if (filters.EndDate.HasValue)
                {
                    // Add one day to include the end date fully
                    var endDatePlusOne = filters.EndDate.Value.AddDays(1);
                    filter = filter & filterBuilder.Lt(h => h.Timestamp, endDatePlusOne);
                }

                // Only include grading actions
                filter = filter & filterBuilder.Eq(h => h.Action, "graded");

                // Get all matching history entries
                var historyEntries = await _gradingHistory.Find(filter).ToListAsync();

                // Calculate statistics
                var statistics = new GradingStatisticsDTO
                {
                    TotalGraded = historyEntries.Count,
                    AverageGrade = historyEntries.Any(h => h.Grade.HasValue) 
                        ? historyEntries.Where(h => h.Grade.HasValue).Average(h => h.Grade.Value) 
                        : 0,
                    GradeDistribution = new int[6], // For grades 0-5
                    GradingsByDay = new Dictionary<string, int>(),
                    RecentActivity = new List<RecentActivityDTO>()
                };

                // Calculate grade distribution
                foreach (var entry in historyEntries.Where(h => h.Grade.HasValue))
                {
                    var grade = (int)Math.Round(entry.Grade.Value);
                    if (grade >= 0 && grade <= 5)
                    {
                        statistics.GradeDistribution[grade]++;
                    }
                }

                // Calculate gradings by day
                var gradingsByDay = historyEntries
                    .GroupBy(h => h.Timestamp.Date)
                    .Select(g => new { Date = g.Key, Count = g.Count() });

                foreach (var day in gradingsByDay)
                {
                    statistics.GradingsByDay[day.Date.ToString("yyyy-MM-dd")] = day.Count;
                }

                // Get recent activity (last 20 entries)
                var recentEntries = await _gradingHistory
                    .Find(filter)
                    .SortByDescending(h => h.Timestamp)
                    .Limit(20)
                    .ToListAsync();

                statistics.RecentActivity = recentEntries.Select(h => new RecentActivityDTO
                {
                    Id = h.Id,
                    SubmissionId = h.SubmissionId,
                    StudentId = h.StudentId,
                    StudentName = h.StudentName,
                    AssignmentId = h.AssignmentId,
                    AssignmentTitle = h.AssignmentTitle,
                    CourseId = h.CourseId,
                    CourseName = h.CourseName,
                    TeacherId = h.TeacherId,
                    TeacherName = h.TeacherName,
                    Grade = h.Grade,
                    Type = h.Action,
                    Timestamp = h.Timestamp
                }).ToList();

                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving grading statistics");
                throw;
            }
        }

        public async Task<GradingHistory> CreateGradingHistoryAsync(GradingHistory history)
        {
            try
            {
                await _gradingHistory.InsertOneAsync(history);
                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating grading history entry");
                throw;
            }
        }
    }
} 