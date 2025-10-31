using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services;
using TehtavaApp.API.Services.Interfaces;
using Xunit;

namespace TehtavaApp.Tests.Services
{
    public class AssignmentServiceTests
    {
        private readonly DbContextOptions<ApplicationDbContext> _options;
        private readonly Mock<ILogger<AssignmentService>> _mockLogger;
        private readonly Mock<INotificationService> _mockNotificationService;

        public AssignmentServiceTests()
        {
            _options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockLogger = new Mock<ILogger<AssignmentService>>();
            _mockNotificationService = new Mock<INotificationService>();
        }

        private async Task SeedDatabase()
        {
            using (var context = new ApplicationDbContext(_options))
            {
                // Add a teacher
                var teacher = new ApplicationUser
                {
                    Id = "teacher1",
                    UserName = "teacher@example.com",
                    Email = "teacher@example.com",
                    FirstName = "Test",
                    LastName = "Teacher"
                };

                // Add a student
                var student = new ApplicationUser
                {
                    Id = "student1",
                    UserName = "student@example.com",
                    Email = "student@example.com",
                    FirstName = "Test",
                    LastName = "Student"
                };

                // Add a course
                var course = new Course
                {
                    Id = 1,
                    Name = "Test Course",
                    Code = "TEST101",
                    Description = "Test course description",
                    TeacherId = teacher.Id
                };

                // Add an assignment
                var assignment = new Assignment
                {
                    Id = 1,
                    Title = "Test Assignment",
                    Description = "Test assignment description",
                    DueDate = DateTime.UtcNow.AddDays(7),
                    CourseId = course.Id,
                    Course = course,
                    MaxPoints = 100
                };

                // Add a submission
                var submission = new AssignmentSubmission
                {
                    Id = 1,
                    AssignmentId = assignment.Id,
                    Assignment = assignment,
                    StudentId = student.Id,
                    Content = "Test submission content",
                    SubmissionDate = DateTime.UtcNow,
                    Status = SubmissionStatus.Submitted
                };

                context.Users.Add(teacher);
                context.Users.Add(student);
                context.Courses.Add(course);
                context.Assignments.Add(assignment);
                context.AssignmentSubmissions.Add(submission);

                await context.SaveChangesAsync();
            }
        }

        [Fact]
        public async Task GradeSubmissionAsync_ValidInput_UpdatesSubmission()
        {
            // Arrange
            await SeedDatabase();

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new AssignmentService(
                    context,
                    _mockLogger.Object,
                    _mockNotificationService.Object);

                // Act
                var result = await service.GradeSubmissionAsync(
                    1, // submissionId
                    "85", // grade
                    "Great work!", // feedback
                    "teacher1"); // gradedById

                // Assert
                Assert.NotNull(result);
                Assert.Equal(85, result.Grade);
                Assert.Equal("Great work!", result.FeedbackText);
                Assert.Equal("teacher1", result.GradedById);
                Assert.Equal(SubmissionStatus.Graded, result.Status);
                Assert.NotNull(result.GradedAt);

                // Verify the submission was updated in the database
                var updatedSubmission = await context.AssignmentSubmissions
                    .FirstOrDefaultAsync(s => s.Id == 1);

                Assert.NotNull(updatedSubmission);
                Assert.Equal(85, updatedSubmission.Grade);
                Assert.Equal("Great work!", updatedSubmission.FeedbackText);
                Assert.Equal("teacher1", updatedSubmission.GradedById);
                Assert.Equal(SubmissionStatus.Graded, updatedSubmission.Status);
            }

            // Verify notification was sent
            _mockNotificationService.Verify(
                n => n.CreateNotificationAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<NotificationType>(),
                    It.IsAny<NotificationMetadata>()),
                Times.Once);
        }

        [Fact]
        public async Task GradeSubmissionAsync_SubmissionNotFound_ReturnsNull()
        {
            // Arrange
            await SeedDatabase();

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new AssignmentService(
                    context,
                    _mockLogger.Object,
                    _mockNotificationService.Object);

                // Act
                var result = await service.GradeSubmissionAsync(
                    999, // non-existent submissionId
                    "85",
                    "Great work!",
                    "teacher1");

                // Assert
                Assert.Null(result);
            }

            // Verify no notification was sent
            _mockNotificationService.Verify(
                n => n.CreateNotificationAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<NotificationType>(),
                    It.IsAny<NotificationMetadata>()),
                Times.Never);
        }

        [Fact]
        public async Task GradeSubmissionAsync_EmptyGrade_SetsNullGrade()
        {
            // Arrange
            await SeedDatabase();

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new AssignmentService(
                    context,
                    _mockLogger.Object,
                    _mockNotificationService.Object);

                // Act
                var result = await service.GradeSubmissionAsync(
                    1, // submissionId
                    "", // empty grade
                    "Feedback only", // feedback
                    "teacher1"); // gradedById

                // Assert
                Assert.NotNull(result);
                Assert.Null(result.Grade);
                Assert.Equal("Feedback only", result.FeedbackText);
                Assert.Equal("teacher1", result.GradedById);
                Assert.Equal(SubmissionStatus.Graded, result.Status);
            }
        }

        [Fact]
        public async Task GradeSubmissionAsync_InvalidGrade_ThrowsException()
        {
            // Arrange
            await SeedDatabase();

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new AssignmentService(
                    context,
                    _mockLogger.Object,
                    _mockNotificationService.Object);

                // Act & Assert
                await Assert.ThrowsAsync<FormatException>(() => service.GradeSubmissionAsync(
                    1, // submissionId
                    "not-a-number", // invalid grade
                    "Feedback with invalid grade", // feedback
                    "teacher1")); // gradedById
            }
        }
    }
} 