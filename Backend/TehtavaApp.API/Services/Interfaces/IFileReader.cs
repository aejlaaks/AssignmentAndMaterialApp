using System.IO;
using System.Threading.Tasks;

namespace TehtavaApp.API.Services.Interfaces
{
    /// <summary>
    /// Interface for reading files from storage
    /// </summary>
    public interface IFileReader
    {
        /// <summary>
        /// Gets a file from storage as a stream
        /// </summary>
        /// <param name="filePath">Path to the file</param>
        /// <returns>Stream containing the file content, or null if not found</returns>
        Task<Stream> GetFileAsync(string filePath);
        
        /// <summary>
        /// Checks if a file exists in storage
        /// </summary>
        /// <param name="filePath">Path to the file</param>
        /// <returns>True if the file exists, false otherwise</returns>
        Task<bool> FileExistsAsync(string filePath);
    }
} 