using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TehtavaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class addeCourseGradingTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourseGrades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Grade = table.Column<double>(type: "float", nullable: false),
                    GradedById = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    GradedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Feedback = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsFinal = table.Column<bool>(type: "bit", nullable: false),
                    GradingType = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseGrades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseGrades_AspNetUsers_GradedById",
                        column: x => x.GradedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseGrades_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CourseGrades_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseGrades_CourseId",
                table: "CourseGrades",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseGrades_GradedById",
                table: "CourseGrades",
                column: "GradedById");

            migrationBuilder.CreateIndex(
                name: "IX_CourseGrades_StudentId",
                table: "CourseGrades",
                column: "StudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseGrades");
        }
    }
}
