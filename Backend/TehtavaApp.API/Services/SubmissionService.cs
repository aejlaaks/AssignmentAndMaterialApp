using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Backend.Models;
using Backend.DTOs;
using Backend.Services;
using Backend.Models.Enums;

namespace Backend.Services
{
    public class SubmissionService : ISubmissionService
    {
        private readonly IMongoCollection<Submission> _submissions;
        private readonly ILogger<SubmissionService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IGradingHistoryService _gradingHistoryService;

        public SubmissionService(IMongoCollection<Submission> submissions, ILogger<SubmissionService> logger, IHttpContextAccessor httpContextAccessor, IGradingHistoryService gradingHistoryService)
        {
            _submissions = submissions;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _gradingHistoryService = gradingHistoryService;
        }

        public async Task<bool> AddFeedbackAttachmentAsync(string submissionId, FeedbackAttachmentDTO attachmentDto)
        {
            try
            {
                var filter = Builders<Submission>.Filter.Eq(s => s.Id, submissionId);
                var submission = await _submissions.Find(filter).FirstOrDefaultAsync();
                
                if (submission == null)
                {
                    throw new KeyNotFoundException($"Submission with ID {submissionId} not found");
                }

                var attachment = new FeedbackAttachment
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    FileName = attachmentDto.FileName,
                    FileType = attachmentDto.FileType,
                    FileUrl = attachmentDto.FileUrl,
                    FileSize = attachmentDto.FileSize,
                    Description = attachmentDto.Description,
                    UploadedAt = DateTime.UtcNow
                };

                var update = Builders<Submission>.Update.Push(s => s.FeedbackAttachments, attachment);
                var result = await _submissions.UpdateOneAsync(filter, update);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding feedback attachment to submission {submissionId}");
                throw;
            }
        }

        public async Task<bool> RemoveFeedbackAttachmentAsync(string submissionId, string attachmentId)
        {
            try
            {
                var filter = Builders<Submission>.Filter.Eq(s => s.Id, submissionId);
                var submission = await _submissions.Find(filter).FirstOrDefaultAsync();
                
                if (submission == null)
                {
                    throw new KeyNotFoundException($"Submission with ID {submissionId} not found");
                }

                // Find the attachment to remove
                var attachment = submission.FeedbackAttachments.FirstOrDefault(a => a.Id == attachmentId);
                if (attachment == null)
                {
                    return false;
                }

                // Remove the attachment
                var update = Builders<Submission>.Update.Pull(s => s.FeedbackAttachments, attachment);
                var result = await _submissions.UpdateOneAsync(filter, update);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing feedback attachment {attachmentId} from submission {submissionId}");
                throw;
            }
        }

        public async Task<Submission> GradeSubmissionAsync(string id, GradeSubmissionDTO gradeData)
        {
            try
            {
                var filter = Builders<Submission>.Filter.Eq(s => s.Id, id);
                var submission = await _submissions.Find(filter).FirstOrDefaultAsync();
                
                if (submission == null)
                {
                    throw new KeyNotFoundException($"Submission with ID {id} not found");
                }

                // Get current user info
                var userId = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userName = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Name)?.Value;

                // Create a history record before updating
                if (submission.Grade.HasValue || !string.IsNullOrEmpty(submission.FeedbackText))
                {
                    var gradingHistory = new GradingHistory
                    {
                        SubmissionId = submission.Id,
                        AssignmentId = submission.AssignmentId,
                        StudentId = submission.StudentId,
                        StudentName = submission.StudentName,
                        TeacherId = userId,
                        TeacherName = userName,
                        Grade = submission.Grade,
                        Feedback = submission.FeedbackText,
                        RequiresRevision = gradeData.RequiresRevision,
                        RevisionDueDate = gradeData.RevisionDueDate,
                        Timestamp = DateTime.UtcNow,
                        Action = "graded"
                    };
                    await _gradingHistoryService.CreateGradingHistoryAsync(gradingHistory);
                }

                // Update submission with grade data
                var update = Builders<Submission>.Update
                    .Set(s => s.Grade, gradeData.Grade)
                    .Set(s => s.FeedbackText, gradeData.Feedback)
                    .Set(s => s.IsRichTextFeedback, gradeData.IsRichTextFeedback)
                    .Set(s => s.GradedAt, DateTime.UtcNow)
                    .Set(s => s.GradedById, userId)
                    .Set(s => s.GradedByName, userName)
                    .Set(s => s.Status, "Graded")
                    .Set(s => s.RequiresRevision, gradeData.RequiresRevision)
                    .Set(s => s.RevisionDueDate, gradeData.RevisionDueDate);

                // Add attachments if provided
                if (gradeData.Attachments != null && gradeData.Attachments.Any())
                {
                    var attachments = gradeData.Attachments.Select(a => new FeedbackAttachment
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        FileName = a.FileName,
                        FileType = a.FileType,
                        FileUrl = a.FileUrl,
                        FileSize = a.FileSize,
                        Description = a.Description,
                        UploadedAt = DateTime.UtcNow
                    }).ToList();

                    update = update.Set(s => s.FeedbackAttachments, attachments);
                }

                await _submissions.UpdateOneAsync(filter, update);
                
                // Get the updated submission
                return await _submissions.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error grading submission with ID {id}");
                throw;
            }
        }

        public async Task<Submission> ReturnSubmissionAsync(string id, ReturnSubmissionDTO returnData)
        {
            try
            {
                var filter = Builders<Submission>.Filter.Eq(s => s.Id, id);
                var submission = await _submissions.Find(filter).FirstOrDefaultAsync();
                
                if (submission == null)
                {
                    throw new KeyNotFoundException($"Submission with ID {id} not found");
                }

                // Get current user info
                var userId = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userName = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Name)?.Value;

                // Create a history record before updating
                if (!string.IsNullOrEmpty(submission.FeedbackText))
                {
                    var history = new GradingHistory
                    {
                        SubmissionId = submission.Id,
                        AssignmentId = submission.AssignmentId,
                        StudentId = submission.StudentId,
                        StudentName = submission.StudentName,
                        TeacherId = userId,
                        TeacherName = userName,
                        AssignmentTitle = submission.AssignmentTitle,
                        CourseId = submission.CourseId,
                        CourseName = submission.CourseName,
                        Grade = submission.Grade,
                        Feedback = submission.FeedbackText,
                        Action = "returned",
                        Timestamp = DateTime.UtcNow,
                        RequiresRevision = returnData.RequiresRevision
                    };
                    
                    await _gradingHistoryService.CreateGradingHistoryAsync(history);
                }

                // Update submission with return data
                var update = Builders<Submission>.Update
                    .Set(s => s.FeedbackText, returnData.Feedback)
                    .Set(s => s.IsRichTextFeedback, returnData.IsRichTextFeedback)
                    .Set(s => s.GradedAt, DateTime.UtcNow)
                    .Set(s => s.GradedById, userId)
                    .Set(s => s.GradedByName, userName)
                    .Set(s => s.Status, "Returned")
                    .Set(s => s.RequiresRevision, returnData.RequiresRevision)
                    .Set(s => s.RevisionDueDate, returnData.RevisionDueDate);

                // Add attachments if provided
                if (returnData.Attachments != null && returnData.Attachments.Any())
                {
                    var attachments = returnData.Attachments.Select(a => new FeedbackAttachment
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        FileName = a.FileName,
                        FileType = a.FileType,
                        FileUrl = a.FileUrl,
                        FileSize = a.FileSize,
                        Description = a.Description,
                        UploadedAt = DateTime.UtcNow
                    }).ToList();

                    update = update.Set(s => s.FeedbackAttachments, attachments);
                }

                await _submissions.UpdateOneAsync(filter, update);
                
                // Get the updated submission
                return await _submissions.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error returning submission with ID {id}");
                throw;
            }
        }

        // Implement the interface methods
        public async Task<IEnumerable<Submission>> GetSubmissionsByAssignmentAsync(string assignmentId)
        {
            return await _submissions.Find(s => s.AssignmentId == assignmentId).ToListAsync();
        }

        public async Task<IEnumerable<Submission>> GetSubmissionsByStudentAsync(string studentId)
        {
            return await _submissions.Find(s => s.StudentId == studentId).ToListAsync();
        }

        public async Task<IEnumerable<Submission>> GetSubmissionsByCourseAsync(string courseId)
        {
            return await _submissions.Find(s => s.CourseId == courseId).ToListAsync();
        }

        public async Task<IEnumerable<Submission>> GetPendingSubmissionsAsync(SubmissionFilterDTO filter = null)
        {
            var builder = Builders<Submission>.Filter;
            var filterDefinition = builder.Empty;

            if (filter != null)
            {
                if (!string.IsNullOrEmpty(filter.CourseId))
                {
                    filterDefinition = filterDefinition & builder.Eq(s => s.CourseId, filter.CourseId);
                }

                if (!string.IsNullOrEmpty(filter.AssignmentId))
                {
                    filterDefinition = filterDefinition & builder.Eq(s => s.AssignmentId, filter.AssignmentId);
                }

                if (!string.IsNullOrEmpty(filter.StudentId))
                {
                    filterDefinition = filterDefinition & builder.Eq(s => s.StudentId, filter.StudentId);
                }

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    if (Enum.TryParse<AssignmentStatus>(filter.Status, out var status))
                    {
                        filterDefinition = filterDefinition & builder.Eq("Status", status.ToString());
                    }
                }

                if (filter.FromDate.HasValue)
                {
                    filterDefinition = filterDefinition & builder.Gte(s => s.SubmittedAt, filter.FromDate.Value);
                }

                if (filter.ToDate.HasValue)
                {
                    filterDefinition = filterDefinition & builder.Lte(s => s.SubmittedAt, filter.ToDate.Value);
                }
            }

            // Default to pending submissions
            if (filterDefinition == builder.Empty)
            {
                filterDefinition = builder.Eq("Status", AssignmentStatus.Submitted.ToString());
            }

            return await _submissions.Find(filterDefinition)
                .Skip((filter?.Page - 1 ?? 0) * (filter?.PageSize ?? 10))
                .Limit(filter?.PageSize ?? 10)
                .ToListAsync();
        }

        public async Task<int> GetPendingSubmissionsCountAsync(string courseId = null)
        {
            var builder = Builders<Submission>.Filter;
            var filterDefinition = builder.Eq("Status", AssignmentStatus.Submitted.ToString());

            if (!string.IsNullOrEmpty(courseId))
            {
                filterDefinition = filterDefinition & builder.Eq(s => s.CourseId, courseId);
            }

            return (int)await _submissions.CountDocumentsAsync(filterDefinition);
        }

        public async Task<Submission> GetSubmissionByIdAsync(string id)
        {
            return await _submissions.Find(s => s.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Submission> CreateSubmissionAsync(Submission submission)
        {
            submission.SubmittedAt = DateTime.UtcNow;
            submission.Status = AssignmentStatus.Submitted.ToString();
            await _submissions.InsertOneAsync(submission);
            return submission;
        }

        public async Task<Submission> UpdateSubmissionAsync(string id, Submission submission)
        {
            submission.Id = id;
            var result = await _submissions.ReplaceOneAsync(s => s.Id == id, submission);
            return result.ModifiedCount > 0 ? submission : null;
        }
    }
} 