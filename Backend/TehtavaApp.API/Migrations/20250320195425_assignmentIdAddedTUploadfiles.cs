using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TehtavaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class assignmentIdAddedTUploadfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignmentId",
                table: "UploadedFiles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignmentId",
                table: "UploadedFiles");
        }
    }
}
