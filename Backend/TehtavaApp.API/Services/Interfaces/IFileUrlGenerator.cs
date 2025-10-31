using System;
using System.Threading.Tasks;

namespace TehtavaApp.API.Services.Interfaces
{
    /// <summary>
    /// Interface for generating URLs to access files in storage
    /// </summary>
    public interface IFileUrlGenerator
    {
        /// <summary>
        /// Gets a public URL for a file
        /// </summary>
        /// <param name="filePath">Path to the file</param>
        /// <returns>URL to access the file</returns>
        string GetFileUrl(string filePath);
        
        /// <summary>
        /// Gets a secure URL with time-limited access to a file
        /// </summary>
        /// <param name="filePath">Path to the file</param>
        /// <param name="expiry">How long the URL should be valid</param>
        /// <returns>Secure URL to access the file</returns>
        Task<string> GetSecureUrl(string filePath, TimeSpan expiry);
    }
} 