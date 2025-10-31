using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services
{
    public class AzureBlobStorageService : IFileStorageService
    {
        private readonly ILogger<AzureBlobStorageService> _logger;
        private readonly IConfiguration _configuration;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly BlobContainerClient _containerClient;
        private readonly string _containerName;
        private readonly string _cdnBaseUrl;
        private readonly bool _useCdn;
        private readonly ApplicationDbContext _dbContext;

        public AzureBlobStorageService(
            ILogger<AzureBlobStorageService> logger,
            IConfiguration configuration,
            ApplicationDbContext dbContext)
        {
            _logger = logger;
            _configuration = configuration;
            _dbContext = dbContext;

            // Get Azure Blob Storage configuration
            var connectionString = _configuration["Storage:Azure:ConnectionString"];
            _containerName = _configuration["Storage:Azure:ContainerName"] ?? "uploads";
            _cdnBaseUrl = _configuration["Storage:Azure:CdnBaseUrl"];
            _useCdn = !string.IsNullOrEmpty(_cdnBaseUrl);

            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogWarning("Azure Blob Storage connection string is not configured. Using fallback storage.");
                return;
            }

            try
            {
                // Create blob service client
                _blobServiceClient = new BlobServiceClient(connectionString);
                _containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                
                // Ensure container exists
                EnsureContainerExistsAsync().GetAwaiter().GetResult();
                
                _logger.LogInformation($"Azure Blob Storage initialized with container: {_containerName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Azure Blob Storage");
                throw;
            }
        }

        private async Task EnsureContainerExistsAsync()
        {
            try
            {
                await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ensuring container exists: {ex.Message}");
                throw;
            }
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
        {
            try
            {
                // Ensure container exists
                await _containerClient.CreateIfNotExistsAsync();
                
                // Remove any leading slashes to ensure consistent path format
                if (fileName != null && fileName.StartsWith("/"))
                {
                    _logger.LogWarning($"Removing leading slash from filename: {fileName}");
                    fileName = fileName.TrimStart('/');
                }
                
                // Extract directory and file parts to preserve folder structure
                string directory = Path.GetDirectoryName(fileName)?.Replace('\\', '/') ?? "";
                string fileNameOnly = Path.GetFileName(fileName);
                
                // Create a unique blob path while preserving the directory structure
                string uniqueBlobPath;
                if (!string.IsNullOrEmpty(directory))
                {
                    uniqueBlobPath = $"{directory}/{Guid.NewGuid()}{Path.GetExtension(fileNameOnly)}";
                }
                else 
                {
                    uniqueBlobPath = $"{Guid.NewGuid()}{Path.GetExtension(fileNameOnly)}";
                }
                
                // Get a reference to the blob
                var blobClient = _containerClient.GetBlobClient(uniqueBlobPath);
                
                // Set the content type
                var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };
                
                // Upload the file
                await blobClient.UploadAsync(fileStream, new BlobUploadOptions { HttpHeaders = blobHttpHeaders });
                
                _logger.LogInformation($"File {uniqueBlobPath} uploaded to Azure Blob Storage container {_containerName}");
                
                // Return the file path (either as a direct URL or a relative path that will be resolved later)
                if (!string.IsNullOrEmpty(_cdnBaseUrl))
                {
                    return $"{_cdnBaseUrl.TrimEnd('/')}/{uniqueBlobPath}";
                }
                
                return uniqueBlobPath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading file {fileName} to Azure Blob Storage");
                throw;
            }
        }
        
        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                // Remove leading slash if present, as Azure Blob Storage paths don't use them
                if (filePath != null && filePath.StartsWith("/"))
                {
                    _logger.LogWarning($"Removing leading slash from path: {filePath}");
                    filePath = filePath.TrimStart('/');
                }
                
                // Use the full path directly instead of just extracting the filename
                var blobClient = _containerClient.GetBlobClient(filePath);
                
                // Delete the blob
                var response = await blobClient.DeleteIfExistsAsync();
                
                if (response)
                {
                    _logger.LogInformation($"File {filePath} deleted from Azure Blob Storage container {_containerName}");
                }
                else
                {
                    _logger.LogWarning($"File {filePath} not found in Azure Blob Storage container {_containerName}");
                }
                
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file {filePath} from Azure Blob Storage");
                return false;
            }
        }
        
        public async Task<Stream> GetFileAsync(string filePath)
        {
            try
            {
                // Remove leading slash if present, as Azure Blob Storage paths don't use them
                if (filePath != null && filePath.StartsWith("/"))
                {
                    _logger.LogWarning($"Removing leading slash from path: {filePath}");
                    filePath = filePath.TrimStart('/');
                }
                
                // Use the full path directly
                var blobClient = _containerClient.GetBlobClient(filePath);
                
                // Check if blob exists
                if (!await blobClient.ExistsAsync())
                {
                    _logger.LogWarning($"File {filePath} not found in Azure Blob Storage container {_containerName}");
                    
                    // Try alternative approach - maybe it was stored with just the filename
                    // This helps with backwards compatibility for older files
                    var fileName = Path.GetFileName(filePath);
                    if (fileName != filePath) // Only if they're different
                    {
                        var fallbackBlobClient = _containerClient.GetBlobClient(fileName);
                        if (await fallbackBlobClient.ExistsAsync())
                        {
                            _logger.LogInformation($"Found file {filePath} using filename-only fallback approach");
                            var fallbackStream = new MemoryStream();
                            await fallbackBlobClient.DownloadToAsync(fallbackStream);
                            fallbackStream.Position = 0;
                            return fallbackStream;
                        }
                    }
                    
                    return null;
                }
                
                // Download the blob to a memory stream
                var memoryStream = new MemoryStream();
                await blobClient.DownloadToAsync(memoryStream);
                
                // Reset the stream position to the beginning
                memoryStream.Position = 0;
                
                return memoryStream;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting file {filePath} from Azure Blob Storage");
                return null;
            }
        }
        
        public string GetFileUrl(string filePath)
        {
            try
            {
                // Remove leading slash if present, as Azure Blob Storage paths don't use them
                if (filePath != null && filePath.StartsWith("/"))
                {
                    _logger.LogWarning($"Removing leading slash from path: {filePath}");
                    filePath = filePath.TrimStart('/');
                }
                
                // If CDN base URL is configured, use it
                if (!string.IsNullOrEmpty(_cdnBaseUrl))
                {
                    // Use the full path
                    return $"{_cdnBaseUrl.TrimEnd('/')}/{filePath}";
                }
                
                // Get a blob client with the full path
                var blobClient = _containerClient.GetBlobClient(filePath);
                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting URL for file {filePath} from Azure Blob Storage");
                return null;
            }
        }
        
        public async Task<bool> FileExistsAsync(string filePath)
        {
            try
            {
                // Remove leading slash if present, as Azure Blob Storage paths don't use them
                if (filePath != null && filePath.StartsWith("/"))
                {
                    _logger.LogWarning($"Removing leading slash from path: {filePath}");
                    filePath = filePath.TrimStart('/');
                }
                
                // Use the full path
                var blobClient = _containerClient.GetBlobClient(filePath);
                
                // Check if blob exists
                return await blobClient.ExistsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking if file {filePath} exists in Azure Blob Storage");
                return false;
            }
        }
        
        /// <summary>
        /// Generates a time-limited secure URL with SAS token for accessing a blob
        /// </summary>
        /// <param name="filePath">Path to the file in blob storage</param>
        /// <param name="expiry">How long the URL should be valid</param>
        /// <returns>Secure URL with SAS token</returns>
        public async Task<string> GetSecureUrl(string filePath, TimeSpan expiry)
        {
            try
            {
                // Remove leading slash if present
                if (filePath != null && filePath.StartsWith("/"))
                {
                    _logger.LogWarning($"Removing leading slash from path: {filePath}");
                    filePath = filePath.TrimStart('/');
                }
                
                // Get blob client
                var blobClient = _containerClient.GetBlobClient(filePath);
                
                // Check if blob exists
                if (!await blobClient.ExistsAsync())
                {
                    _logger.LogWarning($"Blob {filePath} not found when generating SAS token");
                    return null;
                }
                
                // Get storage account name and key from connection string
                var connectionString = _configuration["Storage:Azure:ConnectionString"];
                if (string.IsNullOrEmpty(connectionString))
                {
                    _logger.LogError("Cannot generate SAS token: Connection string is empty");
                    return null;
                }
                
                // Parse the connection string to extract account name and key
                var parts = connectionString.Split(';')
                    .Select(part => part.Trim())
                    .Where(part => !string.IsNullOrEmpty(part))
                    .ToDictionary(
                        part => part.Split('=')[0].Trim(),
                        part => part.Contains('=') ? part.Substring(part.IndexOf('=') + 1) : string.Empty
                    );
                
                string accountName = parts.TryGetValue("AccountName", out var name) ? name : null;
                string accountKey = parts.TryGetValue("AccountKey", out var key) ? key : null;
                
                if (string.IsNullOrEmpty(accountName) || string.IsNullOrEmpty(accountKey))
                {
                    _logger.LogError("Cannot generate SAS token: Account name or key not found in connection string");
                    return null;
                }
                
                // Create shared key credential
                var credential = new Azure.Storage.StorageSharedKeyCredential(accountName, accountKey);
                
                // Create SAS builder
                var sasBuilder = new Azure.Storage.Sas.BlobSasBuilder
                {
                    BlobContainerName = _containerName,
                    BlobName = filePath,
                    Resource = "b", // b for blob
                    ExpiresOn = DateTimeOffset.UtcNow.Add(expiry)
                };
                
                // Set permissions
                sasBuilder.SetPermissions(Azure.Storage.Sas.BlobSasPermissions.Read);
                
                // Generate the SAS token
                var sasToken = sasBuilder.ToSasQueryParameters(credential).ToString();
                
                // Return the full URL with SAS token
                return $"{blobClient.Uri}?{sasToken}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating SAS token for blob {filePath}");
                return null;
            }
        }
        
        public async Task<IEnumerable<string>> ListFilesAsync(string prefix = null)
        {
            var files = new List<string>();
            
            try
            {
                // Create options for the listing operation
                BlobTraits traits = BlobTraits.None;
                BlobStates states = BlobStates.None;
                string prefix1 = prefix ?? "";

                // Use the container's GetBlobsAsync method with the prefix
                await foreach (var blob in _containerClient.GetBlobsAsync(traits, states, prefix1))
                {
                    files.Add(blob.Name);
                }
                
                return files;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error listing files from Azure Blob Storage with prefix {prefix}");
                return files;
            }
        }
        
        public async Task<bool> MigrateLocalFilesToBlobStorageAsync(string localBasePath)
        {
            try
            {
                _logger.LogInformation($"Starting migration of local files from {localBasePath} to Azure Blob Storage");
                
                // Ensure container exists
                await _containerClient.CreateIfNotExistsAsync();
                
                // Get all files from the local directory
                var files = Directory.GetFiles(localBasePath, "*", SearchOption.AllDirectories);
                int migratedCount = 0;
                
                foreach (var filePath in files)
                {
                    try
                    {
                        // Get relative path
                        var relativePath = filePath.Replace(localBasePath, "").TrimStart('\\', '/');
                        
                        // Get a reference to the blob
                        var blobClient = _containerClient.GetBlobClient(relativePath);
                        
                        // Check if blob already exists
                        if (await blobClient.ExistsAsync())
                        {
                            _logger.LogInformation($"File {relativePath} already exists in Azure Blob Storage, skipping");
                            continue;
                        }
                        
                        // Get content type
                        var contentType = GetContentType(filePath);
                        
                        // Set the content type
                        var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };
                        
                        // Upload the file
                        using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                        {
                            await blobClient.UploadAsync(fileStream, new BlobUploadOptions { HttpHeaders = blobHttpHeaders });
                        }
                        
                        migratedCount++;
                        _logger.LogInformation($"File {relativePath} migrated to Azure Blob Storage");
                        
                        // Update material records with new URL if applicable
                        var fileName = Path.GetFileName(filePath);
                        var materials = await _dbContext.Materials
                            .Where(m => m.FileUrl != null && m.FileUrl.Contains(fileName))
                            .ToListAsync();
                            
                        foreach (var material in materials)
                        {
                            // Update the material's FileUrl to use the Azure Blob Storage URL
                            var newUrl = _useCdn 
                                ? $"{_cdnBaseUrl.TrimEnd('/')}/{relativePath}"
                                : blobClient.Uri.ToString();
                                
                            material.FileUrl = newUrl;
                            _logger.LogInformation($"Updated material {material.Id} URL to: {newUrl}");
                        }
                        
                        if (materials.Any())
                        {
                            await _dbContext.SaveChangesAsync();
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error migrating file {filePath} to Azure Blob Storage");
                    }
                }
                
                _logger.LogInformation($"Migration completed. {migratedCount} of {files.Length} files migrated to Azure Blob Storage");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error migrating local files to Azure Blob Storage");
                return false;
            }
        }
        
        private string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".txt" => "text/plain",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".svg" => "image/svg+xml",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                ".mp3" => "audio/mpeg",
                ".mp4" => "video/mp4",
                _ => "application/octet-stream",
            };
        }

        // Legacy methods for FilesController
        public async Task<UploadedFile> UploadFileWithMetadataAsync(Stream fileStream, string fileName, string contentType, string folder, string originalFileName)
        {
            try
            {
                _logger.LogInformation($"Uploading file to Azure Blob Storage: {fileName} in folder: {folder}");

                // Create a unique filename with original extension
                var extension = Path.GetExtension(fileName);
                if (string.IsNullOrEmpty(extension))
                {
                    extension = Path.GetExtension(originalFileName);
                }
                
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";

                // Construct blob path with folder structure
                var blobPath = string.IsNullOrEmpty(folder) 
                    ? uniqueFileName
                    : $"{folder}/{uniqueFileName}";

                // Get blob client
                var blobClient = _containerClient.GetBlobClient(blobPath);

                // Set blob HTTP header (content type)
                var blobOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType
                    }
                };

                // Upload the file
                await blobClient.UploadAsync(fileStream, blobOptions);

                // Construct the file URL
                string fileUrl;
                if (_useCdn)
                {
                    fileUrl = $"{_cdnBaseUrl.TrimEnd('/')}/{blobPath}";
                }
                else
                {
                    fileUrl = blobClient.Uri.ToString();
                }

                // Create an UploadedFile record
                var uploadedFile = new UploadedFile
                {
                    FileName = uniqueFileName,
                    OriginalFileName = originalFileName,
                    FileType = contentType,
                    FileUrl = fileUrl,
                    FileSize = fileStream.Length,
                    Folder = folder,
                    UploadedAt = DateTime.UtcNow,
                    IsStoredInCloud = true,
                    Path = blobPath
                };

                // Save to database
                _dbContext.UploadedFiles.Add(uploadedFile);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation($"File uploaded to Azure Blob Storage, URL: {fileUrl}");
                return uploadedFile;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading file to Azure Blob Storage: {ex.Message}");
                throw new ApplicationException($"Failed to upload file to Azure Blob Storage: {ex.Message}", ex);
            }
        }

        public async Task<UploadedFile> GetFileByIdAsync(string id)
        {
            try
            {
                return await _dbContext.UploadedFiles.FindAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting file with ID {id}: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> DeleteFileByIdAsync(string id)
        {
            try
            {
                var file = await _dbContext.UploadedFiles.FindAsync(id);
                if (file == null)
                {
                    _logger.LogWarning($"File with ID {id} not found in database");
                    return false;
                }

                // If stored in cloud, delete from blob storage
                if (file.IsStoredInCloud && !string.IsNullOrEmpty(file.Path))
                {
                    var blobClient = _containerClient.GetBlobClient(file.Path);
                    await blobClient.DeleteIfExistsAsync();
                    _logger.LogInformation($"Deleted blob: {file.Path}");
                }

                // Remove from database
                _dbContext.UploadedFiles.Remove(file);
                await _dbContext.SaveChangesAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file with ID {id}: {ex.Message}");
                return false;
            }
        }

        public async Task<IEnumerable<UploadedFile>> GetFilesBySubmissionAsync(string submissionId)
        {
            try
            {
                return await _dbContext.UploadedFiles
                    .Where(f => f.SubmissionId == submissionId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting files for submission {submissionId}: {ex.Message}");
                return new List<UploadedFile>();
            }
        }

        public async Task<IEnumerable<UploadedFile>> GetFilesByFolderAsync(string folder)
        {
            try
            {
                return await _dbContext.UploadedFiles
                    .Where(f => f.Folder == folder)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting files for folder {folder}: {ex.Message}");
                return new List<UploadedFile>();
            }
        }

        public async Task<IEnumerable<UploadedFile>> GetFilesByAssignmentAsync(string assignmentId)
        {
            try
            {
                _logger.LogInformation($"Fetching files for assignment ID (string): {assignmentId}");
                
                // Try to parse the string as int
                if (int.TryParse(assignmentId, out int assignmentIdInt))
                {
                    return await GetFilesByAssignmentAsync(assignmentIdInt);
                }
                
                // If not a valid int, return empty result
                _logger.LogWarning($"Assignment ID '{assignmentId}' is not a valid integer");
                return new List<UploadedFile>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting files for assignment {assignmentId}: {ex.Message}");
                return new List<UploadedFile>();
            }
        }
        
        public async Task<IEnumerable<UploadedFile>> GetFilesByAssignmentAsync(int assignmentId)
        {
            try
            {
                _logger.LogInformation($"Fetching files for assignment ID (int): {assignmentId}");
                
                var files = await _dbContext.UploadedFiles
                    .Where(f => f.AssignmentId == assignmentId)
                    .OrderByDescending(f => f.UploadedAt)
                    .ToListAsync();
                
                _logger.LogInformation($"Found {files.Count} files for assignment ID: {assignmentId}");
                return files;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting files for assignment {assignmentId}: {ex.Message}");
                return new List<UploadedFile>();
            }
        }
        
        public async Task<IEnumerable<UploadedFile>> GetFilesByMaterialAsync(int materialId)
        {
            try
            {
                _logger.LogInformation($"Fetching files for material ID: {materialId}");
                
                var files = await _dbContext.UploadedFiles
                    .Where(f => f.MaterialId == materialId)
                    .OrderByDescending(f => f.UploadedAt)
                    .ToListAsync();
                
                _logger.LogInformation($"Found {files.Count} files for material ID: {materialId}");
                return files;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting files for material {materialId}: {ex.Message}");
                return new List<UploadedFile>();
            }
        }
        
        public async Task<bool> UpdateFileAsync(UploadedFile file)
        {
            try
            {
                _logger.LogInformation($"Updating metadata for file ID: {file.Id}");
                _dbContext.UploadedFiles.Update(file);
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Successfully updated metadata for file ID: {file.Id}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating metadata for file ID {file.Id}: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> AssociateFileWithSubmissionAsync(string fileId, string submissionId)
        {
            try
            {
                var file = await _dbContext.UploadedFiles.FindAsync(fileId);
                if (file == null)
                {
                    _logger.LogWarning($"File with ID {fileId} not found in database");
                    return false;
                }

                file.SubmissionId = submissionId;
                await _dbContext.SaveChangesAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error associating file {fileId} with submission {submissionId}: {ex.Message}");
                return false;
            }
        }
    }
} 