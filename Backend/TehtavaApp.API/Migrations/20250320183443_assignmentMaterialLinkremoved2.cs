using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TehtavaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class assignmentMaterialLinkremoved2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "AssignmentSubmissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmissionDate",
                table: "AssignmentSubmissions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<double>(
                name: "MaxPoints",
                table: "Assignments",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Code",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "AssignmentSubmissions");

            migrationBuilder.DropColumn(
                name: "SubmissionDate",
                table: "AssignmentSubmissions");

            migrationBuilder.DropColumn(
                name: "MaxPoints",
                table: "Assignments");
        }
    }
}
