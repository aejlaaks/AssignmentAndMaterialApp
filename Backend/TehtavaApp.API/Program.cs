using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.IO;
using System.Text;
using TehtavaApp.API.Data;
using TehtavaApp.API.Hubs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services;
using TehtavaApp.API.Services.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Jering.Javascript.NodeJS;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using TehtavaApp.API.Middleware;

namespace TehtavaApp.API;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Explicitly load production settings if in production environment
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (environment == "Production")
        {
            Console.WriteLine("Loading production settings...");
            builder.Configuration.AddJsonFile("appsettings.Production.json", optional: false, reloadOnChange: true);
        }

        ConfigureServices(builder);

        var app = builder.Build();

        // Configure static files
        app.UseStaticFiles();
        
        // Configure uploads directory for static files
        var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }
        
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadsPath),
            RequestPath = "/uploads"
        });

        // Initialize roles and admin user
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            await InitializeRolesAndAdminUser(services, builder.Configuration);
            
            // Attempt to repair any broken material file paths
            await RepairMaterialFilePaths(services, builder.Environment);
            
            // Add this line:
            await MigrateFilesToAzureBlobStorageAsync(services, builder.Configuration);
        }

        ConfigureApp(app);

        // Run file verification on startup in production environment
        if (app.Environment.IsProduction())
        {
            try
            {
                // Create a scope to resolve the scoped service
                using var scope = app.Services.CreateScope();
                var fileVerificationService = scope.ServiceProvider.GetRequiredService<MaterialFileVerificationService>();
                
                // Run the verification async but don't block startup
                Task.Run(async () => 
                {
                    // Give the app a moment to fully initialize
                    await Task.Delay(TimeSpan.FromSeconds(10)); 
                    await fileVerificationService.VerifyAndRepairFilesAsync();
                });
                
                app.Logger.LogInformation("Material file verification scheduled for execution");
            }
            catch (Exception ex)
            {
                app.Logger.LogError(ex, "Error setting up material file verification");
            }
        }

        await app.RunAsync();
    }

    private static async Task InitializeRolesAndAdminUser(IServiceProvider services, IConfiguration configuration)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        // Define roles
        string[] roles = { "Admin", "Teacher", "Student" };

        // Create roles if they don't exist
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Get admin user details from configuration
        var adminEmail = configuration["AdminUser:Email"] ?? "admin@tehtavaapp.com";
        var adminPassword = configuration["AdminUser:Password"] ?? "Admin123!";

        // Check if admin user exists
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            // Create admin user
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                PrimaryRole = "Admin",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);

            if (result.Succeeded)
            {
                // Assign Admin role
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
            else
            {
                throw new Exception("Failed to create admin user: " + string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            // Ensure PrimaryRole is set to Admin
            if (adminUser.PrimaryRole != "Admin")
            {
                adminUser.PrimaryRole = "Admin";
                var updateResult = await userManager.UpdateAsync(adminUser);
                if (!updateResult.Succeeded)
                {
                    throw new Exception("Failed to update admin user's PrimaryRole: " + string.Join(", ", updateResult.Errors.Select(e => e.Description)));
                }
            }

            // Ensure the user is in the Admin role
            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }

    private static async Task RepairMaterialFilePaths(IServiceProvider services, IWebHostEnvironment env)
    {
        try
        {
            Console.WriteLine("Starting to check and repair material file paths...");
            
            var dbContext = services.GetRequiredService<ApplicationDbContext>();
            
            // Get all materials
            var materials = await dbContext.Materials.ToListAsync();
            Console.WriteLine($"Found {materials.Count} materials to check");
            
            int repairedCount = 0;
            
            foreach (var material in materials)
            {
                // Skip materials without files
                if (string.IsNullOrEmpty(material.FileUrl) || !material.FileUrl.Contains("."))
                {
                    continue;
                }
                
                // Get the filename
                var fileName = Path.GetFileName(material.FileUrl);
                
                // Check if the physical file exists at the expected location
                string expectedFilePath = Path.Combine(env.WebRootPath, material.FileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                
                if (!File.Exists(expectedFilePath))
                {
                    Console.WriteLine($"File not found at expected path: {expectedFilePath} for material {material.Id}");
                    
                    // Get the uploads folder and search for the file
                    var uploadsFolder = Path.Combine(env.WebRootPath, "uploads");
                    var foundFiles = Directory.GetFiles(uploadsFolder, fileName, SearchOption.AllDirectories);
                    
                    if (foundFiles.Length > 0)
                    {
                        // Use the first found file
                        var foundFilePath = foundFiles[0];
                        
                        // Generate a relative FileUrl from the found path
                        var relativeFileUrl = foundFilePath.Replace(env.WebRootPath, "").Replace("\\", "/");
                        if (!relativeFileUrl.StartsWith("/")) relativeFileUrl = "/" + relativeFileUrl;
                        
                        Console.WriteLine($"Updating material {material.Id} with new path: {relativeFileUrl}");
                        
                        // Update the material
                        material.FileUrl = relativeFileUrl;
                        material.FilePath = foundFilePath;
                        
                        repairedCount++;
                    }
                    else
                    {
                        Console.WriteLine($"Could not find file {fileName} in uploads directory for material {material.Id}");
                    }
                }
            }
            
            if (repairedCount > 0)
            {
                Console.WriteLine($"Saving {repairedCount} repaired material paths to database");
                await dbContext.SaveChangesAsync();
            }
            
            Console.WriteLine("Material file path check completed");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error repairing material paths: {ex.Message}");
        }
    }

    private static void ConfigureServices(WebApplicationBuilder builder)
    {
        // Add services to the container.
        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                // Use IgnoreCycles instead of Preserve to avoid $ref entries
                options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.MaxDepth = 64; // Increase max depth if needed
            });
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        // Add AutoMapper
        builder.Services.AddAutoMapper(typeof(Program).Assembly);

        // Add SignalR
        builder.Services.AddSignalR();

        // Add CORS
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowSpecific", corsBuilder =>
            {
                var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
                if (origins != null && origins.Length > 0)
                {
                    corsBuilder.WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
                else
                {
                    // Fallback if no origins are configured
                    corsBuilder.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                }
            });
        });

        // Add DbContext
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            Console.WriteLine("WARNING: DefaultConnection connection string is null or empty!");
            // Log all available connection strings for debugging
            var connectionStrings = builder.Configuration.GetSection("ConnectionStrings").GetChildren();
            foreach (var conn in connectionStrings)
            {
                Console.WriteLine($"Available connection string: {conn.Key}");
            }
            
            // Try to get connection string from environment variable as fallback
            connectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");
            if (!string.IsNullOrEmpty(connectionString))
            {
                Console.WriteLine("Using connection string from environment variable");
            }
            else
            {
                // Hardcoded fallback for production (use with caution)
                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (environment == "Production")
                {
                    connectionString = "Server=localhost;Database=productiondatabase;User ID=antti;Password=Jormarinne_32;MultipleActiveResultSets=True;TrustServerCertificate=True;Connection Timeout=30;";
                    Console.WriteLine("Using hardcoded production connection string as fallback");
                }
            }
        }
        else
        {
            Console.WriteLine("Connection string found (first 10 chars): " + connectionString.Substring(0, Math.Min(10, connectionString.Length)));
        }
        
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("No valid database connection string found. Please check your configuration.");
        }
        
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Add Identity
        builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // Configure Identity options
        builder.Services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
        });

        // Add JWT Authentication
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                ValidIssuers = jwtSettings.GetSection("ValidIssuers").Get<string[]>() ?? new[] { jwtSettings["Issuer"] },
                ValidAudiences = jwtSettings.GetSection("ValidAudiences").Get<string[]>() ?? new[] { jwtSettings["Audience"] },
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]))
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                },
                // Add debugging event handler
                OnAuthenticationFailed = context =>
                {
                    Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                    return Task.CompletedTask;
                }
            };
        });

        // Register services
        builder.Services.AddScoped<ITokenService, TokenService>();
        builder.Services.AddScoped<IUserService, UserService>();
        builder.Services.AddScoped<ICourseService, CourseService>();
        builder.Services.AddScoped<IGroupService, GroupService>();
        builder.Services.AddScoped<IAssignmentService, AssignmentService>();
        builder.Services.AddScoped<IMaterialService, MaterialService>();
        builder.Services.AddScoped<INotificationService, NotificationService>();
        builder.Services.AddScoped<IAdminService, AdminService>();
        builder.Services.AddScoped<IStudentService, StudentService>();
        builder.Services.AddScoped<ICourseGradingService, CourseGradingService>();
        builder.Services.AddScoped<ITestService, TestService>();
        builder.Services.AddScoped<IAIGradingService, AIGradingService>();
        
        // SOLID Refactoring: Register new abstraction implementations
        builder.Services.AddScoped<IFileUploadHandler, AzureBlobUploadHandler>();
        builder.Services.AddScoped<IMaterialValidator, MaterialValidator>();
        builder.Services.AddScoped<IMaterialNotificationService, MaterialNotificationService>();
        
        // Always use Azure Blob Storage - local storage option removed
        Console.WriteLine("Using Azure Blob Storage for file storage");
        builder.Services.AddScoped<TehtavaApp.API.Services.Interfaces.IFileStorageService, TehtavaApp.API.Services.AzureBlobStorageService>();
        builder.Services.AddScoped<TehtavaApp.API.Services.AzureBlobStorageService>();  // Register directly for migration
        
        // Register new SOLID-based services
        builder.Services.AddScoped<TehtavaApp.API.Services.Interfaces.IFileReader>(sp => 
            sp.GetRequiredService<TehtavaApp.API.Services.Interfaces.IFileStorageService>());
        builder.Services.AddScoped<TehtavaApp.API.Services.Interfaces.IFileWriter>(sp => 
            sp.GetRequiredService<TehtavaApp.API.Services.Interfaces.IFileStorageService>());
        builder.Services.AddScoped<TehtavaApp.API.Services.Interfaces.IFileUrlGenerator>(sp => 
            sp.GetRequiredService<TehtavaApp.API.Services.Interfaces.IFileStorageService>());
        builder.Services.AddScoped<TehtavaApp.API.Services.Interfaces.IMimeTypeResolver, TehtavaApp.API.Services.MimeTypeResolver>();
        builder.Services.AddScoped<TehtavaApp.API.Services.ImageProxyService>();
        
        builder.Services.AddScoped<MaterialFileVerificationService>();
        builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

        // Add NodeJS services for JavaScript rendering
        builder.Services.AddNodeJS();
    }

    private static void ConfigureApp(WebApplication app)
    {
        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
            app.Urls.Add("http://0.0.0.0:5001"); // Development only
        }
        else
        {
            // Production settings
            var useHttps = app.Configuration.GetValue<bool>("Security:RequireHttps", true);
            
            // In production, always use port 5001 as configured in systemd service
            // This will be proxied via Nginx
            app.Urls.Add("http://localhost:5001");
            
            if (useHttps)
            {
                // Enable HSTS if configured
                if (app.Configuration.GetValue<bool>("Security:HstsEnabled", false))
                {
                    app.UseHsts();
                }
            }
        }

        // Only use HttpsRedirection in Development if specifically configured
        if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("UseHttpsRedirection", false))
        {
            app.UseHttpsRedirection();
        }

        app.UseCors("AllowSpecific");

        app.UseAuthentication();
        app.UseAuthorization();
        
        // Add our image proxy debugging middleware
        app.UseImageProxyDebug();

        app.MapControllers();
        app.MapHub<NotificationHub>("/hubs/notifications");
    }

    // Add a method for migrating files to Azure Blob Storage
    private static async Task MigrateFilesToAzureBlobStorageAsync(IServiceProvider services, IConfiguration configuration)
    {
        // Check if Azure Blob Storage is configured
        if (string.IsNullOrEmpty(configuration["Storage:Azure:ConnectionString"]))
        {
            Console.WriteLine("ERROR: Azure Blob Storage not configured. Application requires a valid Azure Storage connection string.");
            return;
        }

        try
        {
            var isEnabled = configuration.GetValue<bool>("Storage:Azure:EnableMigration", false);
            if (!isEnabled)
            {
                Console.WriteLine("File migration is disabled, set Storage:Azure:EnableMigration to true to enable");
                return;
            }

            Console.WriteLine("Starting migration of files to Azure Blob Storage...");
            
            // Get the Azure Blob Storage service
            var storageService = services.GetRequiredService<TehtavaApp.API.Services.AzureBlobStorageService>();
            
            // Get the environment to determine the root path
            var env = services.GetRequiredService<IWebHostEnvironment>();
            var uploadsPath = Path.Combine(env.WebRootPath, "uploads");
            
            // Run the migration
            var result = await storageService.MigrateLocalFilesToBlobStorageAsync(uploadsPath);
            
            if (result)
            {
                Console.WriteLine("Migration to Azure Blob Storage completed successfully");
            }
            else
            {
                Console.WriteLine("Migration to Azure Blob Storage completed with errors");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during file migration: {ex.Message}");
        }
    }
}
