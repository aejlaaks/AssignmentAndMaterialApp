using System;
using System.Collections.Generic;

namespace TehtavaApp.API.DTOs
{
    public class TestDTO
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool Proctored { get; set; }
        public string ShowResults { get; set; }
        public int TimeLimit { get; set; }
        public int PassingScore { get; set; }
        public int Attempts { get; set; }
        public DateTime? DueDate { get; set; }
        public List<string> AllowedResources { get; set; }
        public bool IsVisible { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedById { get; set; }
        public string CreatedByName { get; set; }
        public List<TestQuestionDTO> Questions { get; set; }
    }

    public class TestQuestionDTO
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Type { get; set; }
        public int Points { get; set; }
        public int Order { get; set; }
        public string Explanation { get; set; }
        public string CodeTemplate { get; set; }
        public string CodeLanguage { get; set; }
        public List<TestQuestionOptionDTO> Options { get; set; }
    }

    public class TestQuestionOptionDTO
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class CreateTestDTO
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool Proctored { get; set; }
        public string ShowResults { get; set; }
        public int TimeLimit { get; set; }
        public int PassingScore { get; set; }
        public int Attempts { get; set; }
        public DateTime? DueDate { get; set; }
        public List<string> AllowedResources { get; set; }
        public bool IsVisible { get; set; }
        public List<CreateTestQuestionDTO> Questions { get; set; }
    }

    public class CreateTestQuestionDTO
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Type { get; set; }
        public int Points { get; set; }
        public int Order { get; set; }
        public string Explanation { get; set; }
        public string CodeTemplate { get; set; }
        public string CodeLanguage { get; set; }
        public List<CreateTestQuestionOptionDTO> Options { get; set; }
    }

    public class CreateTestQuestionOptionDTO
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class UpdateTestDTO
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool Proctored { get; set; }
        public string ShowResults { get; set; }
        public int TimeLimit { get; set; }
        public int PassingScore { get; set; }
        public int Attempts { get; set; }
        public DateTime? DueDate { get; set; }
        public List<string> AllowedResources { get; set; }
        public bool IsVisible { get; set; }
        public List<UpdateTestQuestionDTO> Questions { get; set; }
    }

    public class UpdateTestQuestionDTO
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Type { get; set; }
        public int Points { get; set; }
        public int Order { get; set; }
        public string Explanation { get; set; }
        public string CodeTemplate { get; set; }
        public string CodeLanguage { get; set; }
        public List<UpdateTestQuestionOptionDTO> Options { get; set; }
    }

    public class UpdateTestQuestionOptionDTO
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class TestAttemptDTO
    {
        public string Id { get; set; }
        public string TestId { get; set; }
        public string UserId { get; set; }
        public string StudentName { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public decimal? Score { get; set; }
        public bool? IsPassed { get; set; }
        public string Status { get; set; }
        public List<TestAnswerDTO> Answers { get; set; }
    }

    public class TestAnswerDTO
    {
        public string Id { get; set; }
        public string QuestionId { get; set; }
        public List<string> SelectedOptions { get; set; }
        public string TextAnswer { get; set; }
        public bool? IsCorrect { get; set; }
        public int? Points { get; set; }
    }

    public class StartTestAttemptDTO
    {
        public string TestId { get; set; }
    }

    public class SubmitTestAnswerDTO
    {
        public string QuestionId { get; set; }
        public List<string> SelectedOptions { get; set; }
        public string TextAnswer { get; set; }
        public int? TimeSpent { get; set; }
    }

    public class SubmitTestDTO
    {
        public List<SubmitTestAnswerDTO> Answers { get; set; }
    }

    public class GradeTestAttemptDTO
    {
        public string TestAttemptId { get; set; }
        public List<GradeAnswerDTO> Answers { get; set; }
        public string ProctorNotes { get; set; }
    }

    public class GradeAnswerDTO
    {
        public string StudentAnswerId { get; set; }
        public int Points { get; set; }
        public string Feedback { get; set; }
    }
} 