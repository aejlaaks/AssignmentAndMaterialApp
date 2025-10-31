using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.DTOs
{
    // Add this simple class for the submission endpoint
    public class SimpleSubmissionDTO
    {
        // Only require the submission text - the rest will be determined from the context
        public string SubmissionText { get; set; }
    }

    public class SubmissionCreateDto
    {
        public string AssignmentId { get; set; }
        public string Content { get; set; }
        public ICollection<IFormFile> Files { get; set; }
    }

    public class SubmissionUpdateDto
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public double? Grade { get; set; }
        public string Feedback { get; set; }
        public string Status { get; set; }
    }

    public class SubmissionResponseDto
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public string StudentId { get; set; }
        public string StudentName { get; set; }
        public string SubmissionText { get; set; }
        public string Content { get => SubmissionText; set => SubmissionText = value; }
        public SubmissionStatus Status { get; set; }
        public double? Grade { get; set; }
        public string FeedbackText { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? GradedAt { get; set; }
        public string GradedById { get; set; }
        public string GradedByName { get; set; }
        public int AttemptNumber { get; set; }
        public bool RequiresRevision { get; set; }
        public ICollection<MaterialDto> SubmittedMaterials { get; set; }
    }

    public class MaterialDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string FilePath { get; set; }
        public string FileType { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class AssignmentReturnDTO
    {
        public string Feedback { get; set; }
        public bool RequiresRevision { get; set; }
    }
} 