using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface IMaterialService
    {
        Task<Material> CreateMaterialAsync(Material material);
        Task<Material> CreateMaterialAsync(Material material, IFormFile file);
        Task<Material> GetMaterialByIdAsync(int id);
        Task<IEnumerable<Material>> GetMaterialsByCourseIdAsync(int courseId);
        Task<Material> UpdateMaterialAsync(Material material);
        Task DeleteMaterialAsync(int id);
        Task<bool> IsUserAuthorizedForMaterialAsync(string userId, int materialId);
        Task<string> GetMaterialContentAsync(int materialId);
        Task UpdateMaterialContentAsync(int materialId, string content);
        Task<IEnumerable<Material>> SearchMaterialsAsync(string searchTerm, string userId);
    }
}
