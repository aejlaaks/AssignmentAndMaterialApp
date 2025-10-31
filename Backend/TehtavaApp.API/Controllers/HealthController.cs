using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Linq;
using TehtavaApp.API.Data;

namespace TehtavaApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HealthController> _logger;
    private readonly IConfiguration _configuration;

    public HealthController(
        ApplicationDbContext context,
        ILogger<HealthController> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "Healthy" });
    }

    [HttpGet("config")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetConfig()
    {
        var configInfo = new Dictionary<string, string>
        {
            { "Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Not set" },
            { "HasDefaultConnection", _configuration.GetConnectionString("DefaultConnection") != null ? "Yes" : "No" },
            { "ConnectionStringCount", _configuration.GetSection("ConnectionStrings").GetChildren().Count().ToString() }
        };

        // Add available connection string keys
        var connectionStrings = _configuration.GetSection("ConnectionStrings").GetChildren();
        foreach (var conn in connectionStrings)
        {
            configInfo.Add($"ConnectionString:{conn.Key}", "Available");
        }

        return Ok(configInfo);
    }

    [HttpGet("database")]
    public async Task<IActionResult> CheckDatabase()
    {
        try
        {
            // Try to connect to the database
            await _context.Database.CanConnectAsync();
            return Ok(new { status = "connected" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return StatusCode(500, new { status = "error", message = "Database connection failed" });
        }
    }

    [HttpGet("database/tables")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CheckTables()
    {
        try
        {
            // Check if we can connect to the database
            if (!await _context.Database.CanConnectAsync())
            {
                return StatusCode(500, new { status = "error", message = "Cannot connect to database" });
            }

            // Get list of tables in the database
            var tables = new List<string>();
            
            // This SQL query works for SQL Server to get all table names
            var tableQuery = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'";
            var tableNames = await _context.Database.SqlQueryRaw<string>(tableQuery).ToListAsync();
            
            return Ok(new { 
                status = "success", 
                tables = tableNames,
                hasUploadedFilesTable = tableNames.Any(t => t.Equals("UploadedFiles", StringComparison.OrdinalIgnoreCase))
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database tables check failed");
            return StatusCode(500, new { status = "error", message = ex.Message });
        }
    }
}
