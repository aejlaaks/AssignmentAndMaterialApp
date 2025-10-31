using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Backend.Models;
using Backend.Services;
using Backend.DTOs;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/inline-comments")]
    [Authorize]
    public class InlineCommentController : ControllerBase
    {
        private readonly IInlineCommentService _commentService;
        private readonly ILogger<InlineCommentController> _logger;

        public InlineCommentController(IInlineCommentService commentService, ILogger<InlineCommentController> logger)
        {
            _commentService = commentService;
            _logger = logger;
        }

        [HttpGet("submission/{submissionId}")]
        public async Task<ActionResult<IEnumerable<InlineCommentResponseDTO>>> GetBySubmission(string submissionId)
        {
            try
            {
                var comments = await _commentService.GetCommentsBySubmissionAsync(submissionId);
                var commentDtos = comments.Select(MapToResponseDto).ToList();
                return Ok(commentDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving comments for submission {submissionId}");
                return StatusCode(500, "An error occurred while retrieving comments");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InlineCommentResponseDTO>> GetById(string id)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found");
                }

                return Ok(MapToResponseDto(comment));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving comment with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the comment");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult<InlineCommentResponseDTO>> Create(InlineCommentDTO commentDto)
        {
            try
            {
                var teacherId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var teacherName = User.FindFirst(ClaimTypes.Name)?.Value;

                if (string.IsNullOrEmpty(teacherId) || string.IsNullOrEmpty(teacherName))
                {
                    return BadRequest("Teacher information not found in token");
                }

                var comment = await _commentService.CreateCommentAsync(commentDto, teacherId, teacherName);
                return CreatedAtAction(nameof(GetById), new { id = comment.Id }, MapToResponseDto(comment));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating inline comment");
                return StatusCode(500, "An error occurred while creating the comment");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult<InlineCommentResponseDTO>> Update(string id, InlineCommentDTO commentDto)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found");
                }

                var teacherId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (comment.TeacherId != teacherId && !User.IsInRole("Admin"))
                {
                    return Forbid("You can only update your own comments");
                }

                var updatedComment = await _commentService.UpdateCommentAsync(id, commentDto);
                return Ok(MapToResponseDto(updatedComment));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating comment with ID {id}");
                return StatusCode(500, "An error occurred while updating the comment");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found");
                }

                var teacherId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (comment.TeacherId != teacherId && !User.IsInRole("Admin"))
                {
                    return Forbid("You can only delete your own comments");
                }

                var result = await _commentService.DeleteCommentAsync(id);
                if (result)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, "Failed to delete the comment");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting comment with ID {id}");
                return StatusCode(500, "An error occurred while deleting the comment");
            }
        }

        [HttpPost("{id}/attachment")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult> AddAttachment(string id, FeedbackAttachmentDTO attachmentDto)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found");
                }

                var teacherId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (comment.TeacherId != teacherId && !User.IsInRole("Admin"))
                {
                    return Forbid("You can only add attachments to your own comments");
                }

                var result = await _commentService.AddAttachmentToCommentAsync(id, attachmentDto);
                if (result)
                {
                    return Ok();
                }
                else
                {
                    return StatusCode(500, "Failed to add attachment to the comment");
                }
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding attachment to comment with ID {id}");
                return StatusCode(500, "An error occurred while adding the attachment");
            }
        }

        [HttpDelete("{id}/attachment")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<ActionResult> RemoveAttachment(string id)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found");
                }

                var teacherId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (comment.TeacherId != teacherId && !User.IsInRole("Admin"))
                {
                    return Forbid("You can only remove attachments from your own comments");
                }

                var result = await _commentService.RemoveAttachmentFromCommentAsync(id);
                if (result)
                {
                    return Ok();
                }
                else
                {
                    return StatusCode(500, "Failed to remove attachment from the comment");
                }
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing attachment from comment with ID {id}");
                return StatusCode(500, "An error occurred while removing the attachment");
            }
        }

        private InlineCommentResponseDTO MapToResponseDto(InlineComment comment)
        {
            var dto = new InlineCommentResponseDTO
            {
                Id = comment.Id,
                SubmissionId = comment.SubmissionId,
                TeacherId = comment.TeacherId,
                TeacherName = comment.TeacherName,
                Text = comment.Text,
                StartPosition = comment.StartPosition,
                EndPosition = comment.EndPosition,
                ReferenceId = comment.ReferenceId,
                StartLine = comment.StartLine ?? 0,
                EndLine = comment.EndLine ?? 0,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt ?? DateTime.UtcNow
            };

            if (comment.Attachment != null)
            {
                dto.Attachment = new FeedbackAttachmentDTO
                {
                    FileName = comment.Attachment.FileName,
                    FileType = comment.Attachment.FileType,
                    FileUrl = comment.Attachment.FileUrl,
                    FileSize = comment.Attachment.FileSize,
                    Description = comment.Attachment.Description
                };
            }

            return dto;
        }
    }
} 