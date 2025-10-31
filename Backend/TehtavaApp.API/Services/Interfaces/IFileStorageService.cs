using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces
{
    // Combined interface that inherits from the specialized interfaces
    // Maintains backward compatibility with existing code
    public interface IFileStorageService : IFileReader, IFileWriter, IFileUrlGenerator
    {
        // Legacy methods for listing files
        Task<IEnumerable<string>> ListFilesAsync(string prefix = null);
        
        // Legacy support and migration
        Task<bool> MigrateLocalFilesToBlobStorageAsync(string localBasePath);
        
        // Legacy methods for FilesController
        Task<UploadedFile> UploadFileWithMetadataAsync(Stream fileStream, string fileName, string contentType, string folder, string originalFileName);
        Task<UploadedFile> GetFileByIdAsync(string id);
        Task<bool> DeleteFileByIdAsync(string id);
        Task<IEnumerable<UploadedFile>> GetFilesBySubmissionAsync(string submissionId);
        Task<IEnumerable<UploadedFile>> GetFilesByFolderAsync(string folder);
        Task<bool> AssociateFileWithSubmissionAsync(string fileId, string submissionId);
        
        // Methods for assignment files
        Task<bool> UpdateFileAsync(UploadedFile file);
        
        // Updated to use int for assignmentId
        Task<IEnumerable<UploadedFile>> GetFilesByAssignmentAsync(int assignmentId);
        
        // Add overload for backward compatibility
        Task<IEnumerable<UploadedFile>> GetFilesByAssignmentAsync(string assignmentId);
        
        // Methods for material files
        Task<IEnumerable<UploadedFile>> GetFilesByMaterialAsync(int materialId);
    }
} 