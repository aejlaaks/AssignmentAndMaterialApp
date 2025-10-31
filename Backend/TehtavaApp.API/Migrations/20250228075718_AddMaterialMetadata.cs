using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TehtavaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NotificationMetadata_NotificationId",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "Key",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "Value",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "GradedAt",
                table: "Assignments");

            migrationBuilder.AddColumn<int>(
                name: "AssignmentId",
                table: "NotificationMetadata",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignmentTitle",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "NotificationMetadata",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CourseName",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "NotificationMetadata",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Grade",
                table: "NotificationMetadata",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "NotificationMetadata",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GroupName",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaterialId",
                table: "NotificationMetadata",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaterialTitle",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "AssignmentSubmissions",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<double>(
                name: "Grade",
                table: "AssignmentSubmissions",
                type: "float",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Assignments",
                type: "int",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<double>(
                name: "Grade",
                table: "Assignments",
                type: "float",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Assignments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMetadata_AssignmentId",
                table: "NotificationMetadata",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMetadata_CourseId",
                table: "NotificationMetadata",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMetadata_GroupId",
                table: "NotificationMetadata",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMetadata_MaterialId",
                table: "NotificationMetadata",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMetadata_NotificationId",
                table: "NotificationMetadata",
                column: "NotificationId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationMetadata_Assignments_AssignmentId",
                table: "NotificationMetadata",
                column: "AssignmentId",
                principalTable: "Assignments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationMetadata_Courses_CourseId",
                table: "NotificationMetadata",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationMetadata_Materials_MaterialId",
                table: "NotificationMetadata",
                column: "MaterialId",
                principalTable: "Materials",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationMetadata_SchoolGroups_GroupId",
                table: "NotificationMetadata",
                column: "GroupId",
                principalTable: "SchoolGroups",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NotificationMetadata_Assignments_AssignmentId",
                table: "NotificationMetadata");

            migrationBuilder.DropForeignKey(
                name: "FK_NotificationMetadata_Courses_CourseId",
                table: "NotificationMetadata");

            migrationBuilder.DropForeignKey(
                name: "FK_NotificationMetadata_Materials_MaterialId",
                table: "NotificationMetadata");

            migrationBuilder.DropForeignKey(
                name: "FK_NotificationMetadata_SchoolGroups_GroupId",
                table: "NotificationMetadata");

            migrationBuilder.DropIndex(
                name: "IX_NotificationMetadata_AssignmentId",
                table: "NotificationMetadata");

            migrationBuilder.DropIndex(
                name: "IX_NotificationMetadata_CourseId",
                table: "NotificationMetadata");

            migrationBuilder.DropIndex(
                name: "IX_NotificationMetadata_GroupId",
                table: "NotificationMetadata");

            migrationBuilder.DropIndex(
                name: "IX_NotificationMetadata_MaterialId",
                table: "NotificationMetadata");

            migrationBuilder.DropIndex(
                name: "IX_NotificationMetadata_NotificationId",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "AssignmentId",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "AssignmentTitle",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "CourseName",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "GroupName",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "MaterialId",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "MaterialTitle",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "NotificationMetadata");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Assignments");

            migrationBuilder.AddColumn<string>(
                name: "Key",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Value",
                table: "NotificationMetadata",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "AssignmentSubmissions",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Grade",
                table: "AssignmentSubmissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(double),
                oldType: "float",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Assignments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Grade",
                table: "Assignments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(double),
                oldType: "float",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GradedAt",
                table: "Assignments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificationMetadata_NotificationId",
                table: "NotificationMetadata",
                column: "NotificationId");
        }
    }
}
