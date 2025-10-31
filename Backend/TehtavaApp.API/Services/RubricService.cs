using System;
using System.Threading.Tasks;
using MongoDB.Driver;
using Backend.Models;
using Backend.DTOs;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace Backend.Services
{
    public class RubricService : IRubricService
    {
        private readonly IMongoCollection<Rubric> _rubrics;
        private readonly IMongoCollection<GradingHistory> _gradingHistory;
        private readonly ISubmissionService _submissionService;
        private readonly ILogger<RubricService> _logger;

        public RubricService(
            IMongoClient mongoClient,
            ISubmissionService submissionService,
            ILogger<RubricService> logger)
        {
            var database = mongoClient.GetDatabase("tehtavaapp");
            _rubrics = database.GetCollection<Rubric>("rubrics");
            _gradingHistory = database.GetCollection<GradingHistory>("gradingHistory");
            _submissionService = submissionService;
            _logger = logger;
        }

        public async Task<Rubric> GetRubricByIdAsync(string id)
        {
            try
            {
                return await _rubrics.Find(r => r.Id == id).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rubric with ID {Id}", id);
                throw;
            }
        }

        public async Task<Rubric> GetRubricByAssignmentAsync(string assignmentId)
        {
            try
            {
                return await _rubrics.Find(r => r.AssignmentId == assignmentId).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rubric for assignment with ID {AssignmentId}", assignmentId);
                throw;
            }
        }

        public async Task<Rubric> CreateRubricAsync(Rubric rubric)
        {
            try
            {
                // Calculate total points
                rubric.TotalPoints = CalculateTotalPoints(rubric);
                
                await _rubrics.InsertOneAsync(rubric);
                return rubric;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating rubric");
                throw;
            }
        }

        public async Task<Rubric> UpdateRubricAsync(string id, Rubric rubric)
        {
            try
            {
                // Calculate total points
                rubric.TotalPoints = CalculateTotalPoints(rubric);
                
                var result = await _rubrics.ReplaceOneAsync(r => r.Id == id, rubric);
                
                if (result.ModifiedCount == 0)
                {
                    return null;
                }
                
                return rubric;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rubric with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteRubricAsync(string id)
        {
            try
            {
                var result = await _rubrics.DeleteOneAsync(r => r.Id == id);
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting rubric with ID {Id}", id);
                throw;
            }
        }

        public async Task<object> GradeWithRubricAsync(string submissionId, RubricGradeDTO gradeData)
        {
            try
            {
                // Get the submission
                var submission = await _submissionService.GetSubmissionByIdAsync(submissionId);
                if (submission == null)
                {
                    throw new Exception($"Submission with ID {submissionId} not found");
                }

                // Get the rubric
                var rubric = await GetRubricByAssignmentAsync(submission.AssignmentId);
                if (rubric == null)
                {
                    throw new Exception($"Rubric for assignment with ID {submission.AssignmentId} not found");
                }

                // Validate the grading data
                ValidateRubricGradeData(rubric, gradeData);

                // Create grading history entry
                var history = new GradingHistory
                {
                    SubmissionId = submissionId,
                    AssignmentId = submission.AssignmentId,
                    StudentId = submission.StudentId,
                    StudentName = submission.StudentName,
                    TeacherId = submission.GradedById, // Assuming this is set from the authenticated user
                    AssignmentTitle = submission.AssignmentTitle,
                    CourseId = submission.CourseId,
                    CourseName = submission.CourseName,
                    Grade = gradeData.TotalScore,
                    Feedback = gradeData.OverallFeedback,
                    Action = "graded",
                    Timestamp = DateTime.UtcNow,
                    RubricId = rubric.Id,
                    RubricGrade = new RubricGradeData
                    {
                        TotalScore = gradeData.TotalScore,
                        OverallFeedback = gradeData.OverallFeedback,
                        CriteriaGrades = gradeData.CriteriaGrades.Select(cg => new RubricCriterionGrade
                        {
                            CriterionId = cg.CriterionId,
                            LevelId = cg.LevelId,
                            Points = cg.Points,
                            Feedback = cg.Feedback
                        }).ToArray()
                    }
                };

                await _gradingHistory.InsertOneAsync(history);

                // Update the submission with the grade
                await _submissionService.GradeSubmissionAsync(submissionId, new GradeSubmissionDTO
                {
                    Grade = gradeData.TotalScore,
                    Feedback = gradeData.OverallFeedback,
                    RequiresRevision = false // Set as needed
                });

                return new { message = "Submission graded successfully", historyId = history.Id };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error grading submission {SubmissionId} with rubric", submissionId);
                throw;
            }
        }

        public async Task<RubricGradeDTO> GetRubricGradesAsync(string submissionId)
        {
            try
            {
                // Get the most recent grading history entry for this submission that has rubric grades
                var history = await _gradingHistory
                    .Find(h => h.SubmissionId == submissionId && h.RubricGrade != null)
                    .SortByDescending(h => h.Timestamp)
                    .FirstOrDefaultAsync();

                if (history == null || history.RubricGrade == null)
                {
                    return null;
                }

                // Convert to DTO
                return new RubricGradeDTO
                {
                    SubmissionId = submissionId,
                    TotalScore = history.RubricGrade.TotalScore,
                    OverallFeedback = history.RubricGrade.OverallFeedback,
                    CriteriaGrades = history.RubricGrade.CriteriaGrades.Select(cg => new CriterionGradeDTO
                    {
                        CriterionId = cg.CriterionId,
                        LevelId = cg.LevelId,
                        Points = cg.Points,
                        Feedback = cg.Feedback
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rubric grades for submission {SubmissionId}", submissionId);
                throw;
            }
        }

        // Helper methods
        private double CalculateTotalPoints(Rubric rubric)
        {
            double total = 0;
            
            foreach (var criterion in rubric.Criteria)
            {
                if (criterion.Levels.Count > 0)
                {
                    // Get the maximum points from the criterion's levels
                    double maxPoints = criterion.Levels.Max(l => l.Points);
                    total += maxPoints * criterion.Weight;
                }
            }
            
            return Math.Round(total, 2);
        }

        private void ValidateRubricGradeData(Rubric rubric, RubricGradeDTO gradeData)
        {
            // Check that all criteria in the rubric are graded
            foreach (var criterion in rubric.Criteria)
            {
                var criterionGrade = gradeData.CriteriaGrades.FirstOrDefault(cg => cg.CriterionId == criterion.Id);
                if (criterionGrade == null)
                {
                    throw new Exception($"Missing grade for criterion {criterion.Id}");
                }

                // Check that the level exists in the criterion
                var level = criterion.Levels.FirstOrDefault(l => l.Id == criterionGrade.LevelId);
                if (level == null)
                {
                    throw new Exception($"Invalid level {criterionGrade.LevelId} for criterion {criterion.Id}");
                }

                // Check that the points match the level
                if (Math.Abs(criterionGrade.Points - level.Points) > 0.01)
                {
                    throw new Exception($"Points {criterionGrade.Points} do not match level {level.Id} points {level.Points}");
                }
            }
        }
    }
} 