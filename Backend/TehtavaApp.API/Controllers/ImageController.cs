using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TehtavaApp.API.Services;

namespace TehtavaApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        private readonly ImageProxyService _imageProxyService;
        private readonly ILogger<ImageController> _logger;

        public ImageController(
            ImageProxyService imageProxyService,
            ILogger<ImageController> logger)
        {
            _imageProxyService = imageProxyService;
            _logger = logger;
        }

        /// <summary>
        /// Get an image by filename
        /// </summary>
        /// <param name="filename">Image filename</param>
        /// <returns>The image file with appropriate content type</returns>
        [HttpGet("{filename}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(string filename)
        {
            try
            {
                _logger.LogInformation($"Request for image: {filename}");
                
                var (content, contentType) = await _imageProxyService.GetImageAsync(filename);
                
                if (content == null)
                {
                    _logger.LogWarning($"Image not found: {filename}");
                    return NotFound($"Image {filename} not found");
                }
                
                _logger.LogInformation($"Returning image {filename} with content type {contentType}");
                return File(content, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving image {filename}");
                return StatusCode(500, "An error occurred while retrieving the image");
            }
        }

        /// <summary>
        /// Proxy access to an image from a full blob storage URL
        /// </summary>
        /// <param name="url">URL to the image in blob storage</param>
        /// <returns>The image file with appropriate content type</returns>
        [HttpGet("proxy")]
        [AllowAnonymous]
        public async Task<IActionResult> ProxyImage([FromQuery] string url)
        {
            try
            {
                _logger.LogInformation($"Request to proxy image: {url}");
                
                var filename = _imageProxyService.ExtractFilenameFromBlobUrl(url);
                
                if (string.IsNullOrEmpty(filename))
                {
                    _logger.LogWarning($"Invalid blob URL format: {url}");
                    return BadRequest("Invalid URL format");
                }
                
                var (content, contentType) = await _imageProxyService.GetImageAsync(filename);
                
                if (content == null)
                {
                    _logger.LogWarning($"Image not found for URL: {url}");
                    return NotFound($"Image not found");
                }
                
                _logger.LogInformation($"Returning proxied image {filename} with content type {contentType}");
                return File(content, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error proxying image from URL: {url}");
                return StatusCode(500, "An error occurred while retrieving the image");
            }
        }
    }
} 