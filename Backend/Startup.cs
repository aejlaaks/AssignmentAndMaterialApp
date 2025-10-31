using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.FileProviders;
using System.IO;

namespace Backend.Services
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // Register services
            services.AddScoped<ISubmissionService, SubmissionService>();
            services.AddScoped<IRubricService, RubricService>();
            services.AddScoped<IGradingHistoryService, GradingHistoryService>();
            services.AddScoped<IInlineCommentService, InlineCommentService>();
            services.AddScoped<IFileStorageService, FileStorageService>();
            
            // Add HttpContextAccessor for accessing user claims
            services.AddHttpContextAccessor();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Add static file middleware for serving uploaded files
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(
                    Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
                RequestPath = "/uploads"
            });
        }
    }
} 