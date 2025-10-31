using System.Threading.Tasks;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Services
{
    public interface IRubricService
    {
        Task<Rubric> GetRubricByIdAsync(string id);
        Task<Rubric> GetRubricByAssignmentAsync(string assignmentId);
        Task<Rubric> CreateRubricAsync(Rubric rubric);
        Task<Rubric> UpdateRubricAsync(string id, Rubric rubric);
        Task<bool> DeleteRubricAsync(string id);
        Task<object> GradeWithRubricAsync(string submissionId, RubricGradeDTO gradeData);
        Task<RubricGradeDTO> GetRubricGradesAsync(string submissionId);
    }
} 