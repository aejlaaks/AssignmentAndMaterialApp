using System.Threading.Tasks;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces
{
    public interface ITokenService
    {
        Task<string> GenerateTokenAsync(ApplicationUser user);
    }
}
