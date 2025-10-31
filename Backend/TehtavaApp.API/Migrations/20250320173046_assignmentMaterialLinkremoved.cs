using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TehtavaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class assignmentMaterialLinkremoved : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssignmentMaterial");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssignmentMaterial",
                columns: table => new
                {
                    RelatedAssignmentsId = table.Column<int>(type: "int", nullable: false),
                    RelatedMaterialsId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentMaterial", x => new { x.RelatedAssignmentsId, x.RelatedMaterialsId });
                    table.ForeignKey(
                        name: "FK_AssignmentMaterial_Assignments_RelatedAssignmentsId",
                        column: x => x.RelatedAssignmentsId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignmentMaterial_Materials_RelatedMaterialsId",
                        column: x => x.RelatedMaterialsId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentMaterial_RelatedMaterialsId",
                table: "AssignmentMaterial",
                column: "RelatedMaterialsId");
        }
    }
}
