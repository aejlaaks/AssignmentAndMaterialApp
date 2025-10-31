using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.Models;
using Backend.DTOs;
using MongoDB.Driver;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;

namespace Backend.Services
{
    public class InlineCommentService : IInlineCommentService
    {
        private readonly IMongoCollection<InlineComment> _comments;
        private readonly IMongoCollection<Submission> _submissions;
        private readonly ILogger<InlineCommentService> _logger;

        public InlineCommentService(
            IMongoClient mongoClient,
            ILogger<InlineCommentService> logger)
        {
            var database = mongoClient.GetDatabase("TehtavaApp");
            _comments = database.GetCollection<InlineComment>("InlineComments");
            _submissions = database.GetCollection<Submission>("Submissions");
            _logger = logger;
        }

        public async Task<IEnumerable<InlineComment>> GetCommentsBySubmissionAsync(string submissionId)
        {
            try
            {
                var filter = Builders<InlineComment>.Filter.Eq(c => c.SubmissionId, submissionId);
                return await _comments.Find(filter).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving comments for submission {submissionId}");
                throw;
            }
        }

        public async Task<InlineComment> GetCommentByIdAsync(string id)
        {
            try
            {
                var filter = Builders<InlineComment>.Filter.Eq(c => c.Id, id);
                return await _comments.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving comment with ID {id}");
                throw;
            }
        }

        public async Task<InlineComment> CreateCommentAsync(InlineCommentDTO commentDto, string teacherId, string teacherName)
        {
            try
            {
                // Verify submission exists
                var submissionFilter = Builders<Submission>.Filter.Eq(s => s.Id, commentDto.SubmissionId);
                var submission = await _submissions.Find(submissionFilter).FirstOrDefaultAsync();
                
                if (submission == null)
                {
                    throw new KeyNotFoundException($"Submission with ID {commentDto.SubmissionId} not found");
                }

                var comment = new InlineComment
                {
                    SubmissionId = commentDto.SubmissionId,
                    TeacherId = teacherId,
                    TeacherName = teacherName,
                    Text = commentDto.Text,
                    StartPosition = commentDto.StartPosition,
                    EndPosition = commentDto.EndPosition,
                    ReferenceId = commentDto.ReferenceId,
                    StartLine = commentDto.StartLine,
                    EndLine = commentDto.EndLine,
                    CreatedAt = DateTime.UtcNow
                };

                // Add attachment if provided
                if (commentDto.Attachment != null)
                {
                    comment.Attachment = new FeedbackAttachment
                    {
                        FileName = commentDto.Attachment.FileName,
                        FileType = commentDto.Attachment.FileType,
                        FileUrl = commentDto.Attachment.FileUrl,
                        FileSize = commentDto.Attachment.FileSize,
                        Description = commentDto.Attachment.Description,
                        UploadedAt = DateTime.UtcNow
                    };
                }

                await _comments.InsertOneAsync(comment);

                // Update the submission to include the comment ID
                var update = Builders<Submission>.Update.Push(s => s.InlineCommentIds, comment.Id);
                await _submissions.UpdateOneAsync(submissionFilter, update);

                return comment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating inline comment");
                throw;
            }
        }

        public async Task<InlineComment> UpdateCommentAsync(string id, InlineCommentDTO commentDto)
        {
            try
            {
                var filter = Builders<InlineComment>.Filter.Eq(c => c.Id, id);
                var comment = await _comments.Find(filter).FirstOrDefaultAsync();

                if (comment == null)
                {
                    throw new KeyNotFoundException($"Comment with ID {id} not found");
                }

                var update = Builders<InlineComment>.Update
                    .Set(c => c.Text, commentDto.Text)
                    .Set(c => c.StartPosition, commentDto.StartPosition)
                    .Set(c => c.EndPosition, commentDto.EndPosition)
                    .Set(c => c.ReferenceId, commentDto.ReferenceId)
                    .Set(c => c.StartLine, commentDto.StartLine)
                    .Set(c => c.EndLine, commentDto.EndLine)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow);

                await _comments.UpdateOneAsync(filter, update);
                
                // Get the updated comment
                return await _comments.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating comment with ID {id}");
                throw;
            }
        }

        public async Task<bool> DeleteCommentAsync(string id)
        {
            try
            {
                var filter = Builders<InlineComment>.Filter.Eq(c => c.Id, id);
                var comment = await _comments.Find(filter).FirstOrDefaultAsync();

                if (comment == null)
                {
                    return false;
                }

                // Remove the comment ID from the submission
                var submissionFilter = Builders<Submission>.Filter.Eq(s => s.Id, comment.SubmissionId);
                var submissionUpdate = Builders<Submission>.Update.Pull(s => s.InlineCommentIds, id);
                await _submissions.UpdateOneAsync(submissionFilter, submissionUpdate);

                // Delete the comment
                var result = await _comments.DeleteOneAsync(filter);
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting comment with ID {id}");
                throw;
            }
        }

        public async Task<bool> AddAttachmentToCommentAsync(string commentId, FeedbackAttachmentDTO attachmentDto)
        {
            try
            {
                var filter = Builders<InlineComment>.Filter.Eq(c => c.Id, commentId);
                var comment = await _comments.Find(filter).FirstOrDefaultAsync();

                if (comment == null)
                {
                    throw new KeyNotFoundException($"Comment with ID {commentId} not found");
                }

                var attachment = new FeedbackAttachment
                {
                    FileName = attachmentDto.FileName,
                    FileType = attachmentDto.FileType,
                    FileUrl = attachmentDto.FileUrl,
                    FileSize = attachmentDto.FileSize,
                    Description = attachmentDto.Description,
                    UploadedAt = DateTime.UtcNow
                };

                var update = Builders<InlineComment>.Update
                    .Set(c => c.Attachment, attachment)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow);

                var result = await _comments.UpdateOneAsync(filter, update);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding attachment to comment with ID {commentId}");
                throw;
            }
        }

        public async Task<bool> RemoveAttachmentFromCommentAsync(string commentId)
        {
            try
            {
                var filter = Builders<InlineComment>.Filter.Eq(c => c.Id, commentId);
                var comment = await _comments.Find(filter).FirstOrDefaultAsync();

                if (comment == null)
                {
                    throw new KeyNotFoundException($"Comment with ID {commentId} not found");
                }

                var update = Builders<InlineComment>.Update
                    .Unset(c => c.Attachment)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow);

                var result = await _comments.UpdateOneAsync(filter, update);
                return result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing attachment from comment with ID {commentId}");
                throw;
            }
        }
    }
} 