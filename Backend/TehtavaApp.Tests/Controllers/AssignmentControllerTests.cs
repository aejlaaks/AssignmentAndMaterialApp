using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TehtavaApp.API.Controllers;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using Xunit;

namespace TehtavaApp.Tests.Controllers
{
    public class AssignmentControllerTests
    {
        private readonly Mock<IAssignmentService> _mockAssignmentService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ILogger<AssignmentController>> _mockLogger;
        private readonly AssignmentController _controller;

        public AssignmentControllerTests()
        {
            _mockAssignmentService = new Mock<IAssignmentService>();
            _mockMapper = new Mock<IMapper>();
            _mockLogger = new Mock<ILogger<AssignmentController>>();

            _controller = new AssignmentController(
                _mockAssignmentService.Object,
                _mockMapper.Object,
                _mockLogger.Object);

            // Setup controller context with user claims
            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "testUserId"),
                new Claim(ClaimTypes.Role, "Teacher")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GradeSubmission_ValidInput_ReturnsOkResult()
        {
            // Arrange
            var submissionId = "1";
            var gradeDto = new AssignmentGradeDTO
            {
                Grade = 85.5,
                Feedback = "Great work!"
            };

            var submission = new AssignmentSubmission
            {
                Id = 1,
                StudentId = "studentId",
                AssignmentId = 1,
                Content = "Test submission",
                Status = SubmissionStatus.Submitted,
                Assignment = new Assignment { Title = "Test Assignment", CourseId = 1 }
            };

            var responseDto = new SubmissionResponseDto
            {
                Id = "1",
                StudentId = "studentId",
                AssignmentId = "1",
                Content = "Test submission",
                Status = 2, // Graded
                Grade = 85.5,
                FeedbackText = "Great work!"
            };

            _mockAssignmentService.Setup(s => s.GradeSubmissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ReturnsAsync(submission);

            _mockMapper.Setup(m => m.Map<SubmissionResponseDto>(It.IsAny<AssignmentSubmission>()))
                .Returns(responseDto);

            // Act
            var result = await _controller.GradeSubmission(submissionId, gradeDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<SubmissionResponseDto>(okResult.Value);
            Assert.Equal(responseDto.Id, returnValue.Id);
            Assert.Equal(responseDto.Grade, returnValue.Grade);
            Assert.Equal(responseDto.FeedbackText, returnValue.FeedbackText);
            Assert.Equal(responseDto.Status, returnValue.Status);
        }

        [Fact]
        public async Task GradeSubmission_InvalidId_ReturnsBadRequest()
        {
            // Arrange
            var submissionId = "invalid";
            var gradeDto = new AssignmentGradeDTO
            {
                Grade = 85.5,
                Feedback = "Great work!"
            };

            // Act
            var result = await _controller.GradeSubmission(submissionId, gradeDto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GradeSubmission_SubmissionNotFound_ReturnsNotFound()
        {
            // Arrange
            var submissionId = "1";
            var gradeDto = new AssignmentGradeDTO
            {
                Grade = 85.5,
                Feedback = "Great work!"
            };

            _mockAssignmentService.Setup(s => s.GradeSubmissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ReturnsAsync((AssignmentSubmission)null);

            // Act
            var result = await _controller.GradeSubmission(submissionId, gradeDto);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GradeSubmission_NullGrade_PassesEmptyString()
        {
            // Arrange
            var submissionId = "1";
            var gradeDto = new AssignmentGradeDTO
            {
                Grade = null,
                Feedback = "Feedback without grade"
            };

            var submission = new AssignmentSubmission
            {
                Id = 1,
                StudentId = "studentId",
                AssignmentId = 1,
                Content = "Test submission",
                Status = SubmissionStatus.Submitted,
                Assignment = new Assignment { Title = "Test Assignment", CourseId = 1 }
            };

            var responseDto = new SubmissionResponseDto
            {
                Id = "1",
                StudentId = "studentId",
                AssignmentId = "1",
                Content = "Test submission",
                Status = 2, // Graded
                Grade = null,
                FeedbackText = "Feedback without grade"
            };

            _mockAssignmentService.Setup(s => s.GradeSubmissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ReturnsAsync(submission)
                .Callback<int, string, string, string>((id, grade, feedback, userId) => 
                {
                    Assert.Equal("", grade);
                    Assert.Equal("Feedback without grade", feedback);
                    Assert.Equal("testUserId", userId);
                });

            _mockMapper.Setup(m => m.Map<SubmissionResponseDto>(It.IsAny<AssignmentSubmission>()))
                .Returns(responseDto);

            // Act
            var result = await _controller.GradeSubmission(submissionId, gradeDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<SubmissionResponseDto>(okResult.Value);
            _mockAssignmentService.Verify(s => s.GradeSubmissionAsync(
                It.Is<int>(id => id == 1),
                It.Is<string>(grade => grade == ""),
                It.Is<string>(feedback => feedback == "Feedback without grade"),
                It.Is<string>(userId => userId == "testUserId")), 
                Times.Once);
        }
    }
} 