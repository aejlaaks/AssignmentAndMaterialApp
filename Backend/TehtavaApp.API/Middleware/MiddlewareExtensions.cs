using Microsoft.AspNetCore.Builder;

namespace TehtavaApp.API.Middleware
{
    /// <summary>
    /// Extension methods for registering middleware
    /// </summary>
    public static class MiddlewareExtensions
    {
        /// <summary>
        /// Adds middleware to debug and log image proxy requests
        /// </summary>
        /// <param name="builder">The application builder</param>
        /// <returns>The application builder</returns>
        public static IApplicationBuilder UseImageProxyDebug(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ImageProxyDebugMiddleware>();
        }
    }
} 