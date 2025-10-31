using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace TehtavaApp.API.Middleware
{
    /// <summary>
    /// Middleware to debug and log image proxy requests
    /// </summary>
    public class ImageProxyDebugMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ImageProxyDebugMiddleware> _logger;

        public ImageProxyDebugMiddleware(RequestDelegate next, ILogger<ImageProxyDebugMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if this is an image request
            if (context.Request.Path.StartsWithSegments("/api/image"))
            {
                _logger.LogInformation($"Image Proxy Request: {context.Request.Path} from {context.Connection.RemoteIpAddress}");
                
                // Store the original response body stream
                var originalBodyStream = context.Response.Body;
                
                try
                {
                    // Create a new memory stream to capture the response
                    using var responseBody = new MemoryStream();
                    context.Response.Body = responseBody;

                    // Continue processing the request
                    await _next(context);

                    // Log the response status
                    _logger.LogInformation($"Image Proxy Response: {context.Response.StatusCode} for {context.Request.Path}");
                    
                    // If it's an error, log more details
                    if (context.Response.StatusCode >= 400)
                    {
                        _logger.LogWarning($"Image Proxy Error: {context.Response.StatusCode} for {context.Request.Path}");
                        
                        // Try to read the response body for error details
                        responseBody.Seek(0, SeekOrigin.Begin);
                        using var reader = new StreamReader(responseBody);
                        var responseText = await reader.ReadToEndAsync();
                        
                        if (!string.IsNullOrEmpty(responseText))
                        {
                            _logger.LogWarning($"Image Proxy Error Details: {responseText}");
                        }
                    }
                    
                    // Copy the response to the original stream and return it to the client
                    responseBody.Seek(0, SeekOrigin.Begin);
                    await responseBody.CopyToAsync(originalBodyStream);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Exception in Image Proxy Middleware: {ex.Message}");
                    
                    // Ensure we return a response even if an exception occurs
                    context.Response.Body = originalBodyStream;
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsync("An error occurred processing the image request.");
                }
                finally
                {
                    // Restore the original response body stream
                    context.Response.Body = originalBodyStream;
                }
            }
            else
            {
                // Not an image request, just continue the pipeline
                await _next(context);
            }
        }
    }
} 