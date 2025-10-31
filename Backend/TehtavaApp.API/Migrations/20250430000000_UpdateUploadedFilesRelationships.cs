using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TehtavaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUploadedFilesRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First, drop existing AssignmentId column if it exists to prepare for type change
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                migrationBuilder.Sql(
                    @"IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'AssignmentId' AND Object_ID = Object_ID(N'UploadedFiles'))
                    BEGIN
                        ALTER TABLE [UploadedFiles] DROP COLUMN [AssignmentId]
                    END");
            }
            else
            {
                try
                {
                    migrationBuilder.DropColumn(
                        name: "AssignmentId",
                        table: "UploadedFiles");
                }
                catch
                {
                    // Ignore errors if column doesn't exist
                }
            }
            
            // Re-add AssignmentId as int
            migrationBuilder.AddColumn<int>(
                name: "AssignmentId",
                table: "UploadedFiles",
                type: "int",
                nullable: true);
            
            // Add MaterialId column as int
            migrationBuilder.AddColumn<int>(
                name: "MaterialId",
                table: "UploadedFiles",
                type: "int",
                nullable: true);
                
            // Drop CourseId column if it exists
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                // For SQL Server
                migrationBuilder.Sql(
                    @"IF EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'CourseId' AND Object_ID = Object_ID(N'UploadedFiles'))
                    BEGIN
                        ALTER TABLE [UploadedFiles] DROP COLUMN [CourseId]
                    END");
            }
            else
            {
                // For SQLite and others - try a simple drop column if supported
                try
                {
                    migrationBuilder.DropColumn(
                        name: "CourseId",
                        table: "UploadedFiles");
                }
                catch
                {
                    // Ignore errors if column doesn't exist
                }
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the integer type columns
            migrationBuilder.DropColumn(
                name: "AssignmentId",
                table: "UploadedFiles");
                
            migrationBuilder.DropColumn(
                name: "MaterialId",
                table: "UploadedFiles");
                
            // Add string type columns back
            migrationBuilder.AddColumn<string>(
                name: "AssignmentId",
                table: "UploadedFiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
                
            migrationBuilder.AddColumn<string>(
                name: "MaterialId",
                table: "UploadedFiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
                
            // Add CourseId column back
            migrationBuilder.AddColumn<string>(
                name: "CourseId",
                table: "UploadedFiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }
    }
} 