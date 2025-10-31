using System.IO;
using System.Threading.Tasks;

namespace TehtavaApp.API.Services.Interfaces
{
    /// <summary>
    /// Interface for writing files to storage
    /// </summary>
    public interface IFileWriter
    {
        /// <summary>
        /// Uploads a file to storage
        /// </summary>
        /// <param name="fileStream">Stream containing file content</param>
        /// <param name="fileName">Name of the file</param>
        /// <param name="contentType">MIME type of the file</param>
        /// <returns>URL or path to the uploaded file</returns>
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
        
        /// <summary>
        /// Deletes a file from storage
        /// </summary>
        /// <param name="filePath">Path to the file</param>
        /// <returns>True if deletion was successful, false otherwise</returns>
        Task<bool> DeleteFileAsync(string filePath);
    }
} 