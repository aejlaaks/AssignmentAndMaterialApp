namespace TehtavaApp.API.Services.Interfaces
{
    /// <summary>
    /// Interface for resolving MIME types from filenames or file extensions
    /// </summary>
    public interface IMimeTypeResolver
    {
        /// <summary>
        /// Gets the MIME type for a file based on its filename or extension
        /// </summary>
        /// <param name="filename">Filename or file extension</param>
        /// <returns>MIME type string</returns>
        string GetMimeType(string filename);
    }
} 