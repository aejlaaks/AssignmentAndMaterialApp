using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.DTOs;
using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CourseController : BaseController
    {
        private readonly ICourseService _courseService;
        private readonly IGroupService _groupService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CourseController(ICourseService courseService, IGroupService groupService, UserManager<ApplicationUser> userManager)
        {
            _courseService = courseService;
            _groupService = groupService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseListItemDTO>>> GetCourses()
        {
            var courses = await _courseService.GetCoursesAsync();
            return Ok(courses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDTO>> GetCourse(string id)
        {
            if (!int.TryParse(id, out _))
                return BadRequest("Invalid course ID format");

            Console.WriteLine($"Getting course with ID: {id}");
            
            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            // Log content blocks for debugging
            Console.WriteLine($"Course {id} has content blocks: {(course.ContentBlocks != null ? "Yes" : "No")}");
            if (course.ContentBlocks != null)
            {
                try
                {
                    Console.WriteLine($"Content blocks count: {course.ContentBlocks.Count}");
                    
                    // Count blocks by type
                    var blockTypes = new Dictionary<string, int>();
                    foreach (var block in course.ContentBlocks)
                    {
                        try
                        {
                            var blockDict = block as System.Text.Json.JsonElement?;
                            string type = "unknown";
                            
                            if (blockDict?.TryGetProperty("type", out var typeProperty) == true)
                            {
                                type = typeProperty.GetString() ?? "unknown";
                            }
                            
                            if (!blockTypes.ContainsKey(type))
                                blockTypes[type] = 0;
                                
                            blockTypes[type]++;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error processing block: {ex.Message}");
                        }
                    }
                    
                    // Log block type counts
                    foreach (var kvp in blockTypes)
                    {
                        Console.WriteLine($"Block type '{kvp.Key}': {kvp.Value}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error counting content blocks: {ex.Message}");
                }
            }

            return Ok(course);
        }

        [HttpPost]
        public async Task<ActionResult<CourseDTO>> CreateCourse([FromBody] CourseCreateDTO courseDto)
        {
            try
            {
                var course = new Course
                {
                    Name = courseDto.Name,
                    Description = courseDto.Description,
                    TeacherId = courseDto.TeacherId,
                    Code = courseDto.Code,
                    StartDate = courseDto.StartDate,
                    EndDate = courseDto.EndDate,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ContentBlocksJson = "[]" // Alustetaan tyhjäksi JSON-taulukoksi
                };
                
                // Serialize ContentBlocks if provided
                if (courseDto.ContentBlocks != null && courseDto.ContentBlocks.Any())
                {
                    try
                    {
                        course.ContentBlocksJson = System.Text.Json.JsonSerializer.Serialize(courseDto.ContentBlocks);
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue
                        Console.WriteLine($"Error serializing content blocks: {ex.Message}");
                    }
                }

                var result = await _courseService.CreateCourseAsync(course);
                return CreatedAtAction(nameof(GetCourse), new { id = result.Id.ToString() }, result);
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"Error creating course: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, "An error occurred while creating the course");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CourseDTO>> UpdateCourse(string id, [FromBody] CourseUpdateDTO courseDto)
        {
            try
            {
                if (!int.TryParse(id, out int courseId))
                    return BadRequest("Invalid course ID format");

                var existingCourse = await _courseService.GetCourseAsync(id);
                if (existingCourse == null)
                    return NotFound();

                if (!await _courseService.CanManageCourseAsync(id, UserId))
                    return Forbid();

                var updatedCourse = new Course
                {
                    Id = courseId,
                    Name = courseDto.Name,
                    Description = courseDto.Description,
                    TeacherId = existingCourse.TeacherId,
                    Code = courseDto.Code,
                    StartDate = courseDto.StartDate,
                    EndDate = courseDto.EndDate,
                    IsActive = courseDto.IsActive,
                    ContentBlocksJson = "[]", // Alustetaan tyhjäksi JSON-taulukoksi
                    CreatedAt = DateTime.Parse(existingCourse.CreatedAt.ToString()),
                    UpdatedAt = DateTime.UtcNow
                };
                
                // Serialize ContentBlocks if provided
                if (courseDto.ContentBlocks != null && courseDto.ContentBlocks.Any())
                {
                    try
                    {
                        updatedCourse.ContentBlocksJson = System.Text.Json.JsonSerializer.Serialize(courseDto.ContentBlocks);
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue
                        Console.WriteLine($"Error serializing content blocks: {ex.Message}");
                    }
                }

                var result = await _courseService.UpdateCourseAsync(updatedCourse);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log the error
                Console.WriteLine($"Error updating course: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, "An error occurred while updating the course");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCourse(string id)
        {
            if (!int.TryParse(id, out _))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            if (!await _courseService.CanManageCourseAsync(id, UserId))
                return Forbid();

            await _courseService.DeleteCourseAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/enroll")]
        public async Task<ActionResult> EnrollStudent(string id, [FromBody] CourseEnrollmentDTO enrollmentDto)
        {
            if (!int.TryParse(id, out int courseId))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            // Haetaan kurssin ryhmät
            var groups = await _courseService.GetCourseGroupsAsync(id);
            if (!groups.Any())
                return BadRequest("Course has no groups. Students must be enrolled through groups.");

            // Oletuksena lisätään opiskelija ensimmäiseen ryhmään
            // Tuotantokäytössä tässä voisi olla logiikkaa, joka valitsee sopivan ryhmän
            var defaultGroup = groups.First();
            
            // Käytetään GroupService-palvelua opiskelijan lisäämiseen ryhmään
            var result = await _groupService.AddStudentAsync(defaultGroup.Id, enrollmentDto.StudentId);
            if (!result)
                return BadRequest("Failed to enroll student to the course group");

            return NoContent();
        }

        [HttpDelete("{id}/enroll/{studentId}")]
        public async Task<ActionResult> UnenrollStudent(string id, string studentId)
        {
            if (!int.TryParse(id, out int courseId))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            // Haetaan kurssin ryhmät
            var groups = await _courseService.GetCourseGroupsAsync(id);
            if (!groups.Any())
                return NoContent(); // Ei ryhmiä, joten opiskelija ei ole ilmoittautunut

            // Poistetaan opiskelija kaikista kurssin ryhmistä
            bool anySuccess = false;
            foreach (var group in groups)
            {
                var result = await _groupService.RemoveStudentAsync(group.Id, studentId);
                if (result)
                    anySuccess = true;
            }

            if (!anySuccess)
                return BadRequest("Failed to unenroll student from the course groups");

            return NoContent();
        }

        [HttpGet("{id}/stats")]
        public async Task<ActionResult<CourseStatsDTO>> GetCourseStats(string id)
        {
            if (!int.TryParse(id, out _))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            var stats = await _courseService.GetCourseStatsAsync(id);
            return Ok(stats);
        }

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<CourseListItemDTO>>> GetMyCourses()
        {
            var courses = await _courseService.GetUserCoursesAsync(UserId);
            return Ok(courses);
        }

        [HttpGet("enrolled")]
        public async Task<ActionResult<IEnumerable<CourseListItemDTO>>> GetEnrolledCourses()
        {
            var courses = await _courseService.GetUserCoursesAsync(UserId);
            return Ok(courses);
        }

        [HttpGet("teaching")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<IEnumerable<CourseListItemDTO>>> GetTeachingCourses()
        {
            var courses = await _courseService.GetTeachingCoursesAsync(UserId);
            return Ok(courses);
        }

        [HttpGet("{id}/groups")]
        public async Task<ActionResult<IEnumerable<SchoolGroup>>> GetCourseGroups(string id)
        {
            try
            {
                Console.WriteLine($"DEBUG: GetCourseGroups-metodi kutsuttu kurssille {id}");
                
                if (!int.TryParse(id, out int courseId))
                {
                    Console.Error.WriteLine($"Virheellinen kurssin ID: {id}");
                    return BadRequest("Invalid course ID format");
                }

                var course = await _courseService.GetCourseAsync(id);
                if (course == null)
                {
                    Console.Error.WriteLine($"Kurssia ei löydy ID:llä: {id}");
                    return NotFound();
                }

                Console.WriteLine($"DEBUG: Kurssi löytyi, haetaan ryhmät...");
                var groups = await _courseService.GetCourseGroupsAsync(id);
                
                // Lokitetaan palautettavat ryhmät
                Console.WriteLine($"DEBUG: Palautetaan {groups.Count()} ryhmää kurssille {id}");
                foreach (var group in groups)
                {
                    Console.WriteLine($"DEBUG: Ryhmä {group.Id} - {group.Name}, opiskelijoita: {group.StudentEnrollments?.Count ?? 0}");
                    Console.WriteLine($"DEBUG: Ryhmän kurssit: {group.Courses?.Count ?? 0}");
                    if (group.Courses != null && group.Courses.Any())
                    {
                        foreach (var courseItem in group.Courses)
                        {
                            Console.WriteLine($"DEBUG: Kurssi {courseItem.Id} - {courseItem.Name}");
                        }
                    }
                }
                
                // Käytetään JsonSerializerOptions, jotta viittaukset säilyvät
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve,
                    MaxDepth = 32
                };
                
                // Serialisoidaan ja deserialisoidaan ryhmät, jotta viittaukset säilyvät
                var serialized = System.Text.Json.JsonSerializer.Serialize(groups, options);
                Console.WriteLine($"DEBUG: Serialisoitu JSON: {serialized.Substring(0, Math.Min(100, serialized.Length))}...");
                
                return Ok(groups);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Virhe haettaessa kurssin {id} ryhmiä: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);
                return StatusCode(500, "An error occurred while fetching course groups");
            }
        }

        [HttpGet("{id}/students")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetCourseStudents(string id)
        {
            try
            {
                Console.WriteLine($"DEBUG: GetCourseStudents-metodi kutsuttu kurssille {id}");
                
                if (!int.TryParse(id, out int courseId))
                {
                    Console.Error.WriteLine($"Virheellinen kurssin ID: {id}");
                    return BadRequest("Invalid course ID format");
                }

                var course = await _courseService.GetCourseAsync(id);
                if (course == null)
                {
                    Console.Error.WriteLine($"Kurssia ei löydy ID:llä: {id}");
                    return NotFound();
                }

                Console.WriteLine($"DEBUG: Kurssi löytyi, haetaan opiskelijat...");
                var students = await _courseService.GetCourseStudentsAsync(id);
                
                // Lokitetaan palautettavat opiskelijat
                Console.WriteLine($"DEBUG: Palautetaan {students.Count()} opiskelijaa kurssille {id}");
                
                return Ok(students);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Virhe haettaessa kurssin {id} opiskelijoita: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);
                return StatusCode(500, "An error occurred while fetching course students");
            }
        }

        [HttpPost("{id}/enroll/{studentId}")]
        public async Task<ActionResult> EnrollStudentById(string id, string studentId)
        {
            if (!int.TryParse(id, out int courseId))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            // Haetaan kurssin ryhmät
            var groups = await _courseService.GetCourseGroupsAsync(id);
            if (!groups.Any())
                return BadRequest("Course has no groups. Students must be enrolled through groups.");

            // Oletuksena lisätään opiskelija ensimmäiseen ryhmään
            // Tuotantokäytössä tässä voisi olla logiikkaa, joka valitsee sopivan ryhmän
            var defaultGroup = groups.First();
            
            // Käytetään GroupService-palvelua opiskelijan lisäämiseen ryhmään
            var result = await _groupService.AddStudentAsync(defaultGroup.Id, studentId);
            if (!result)
                return BadRequest("Failed to enroll student to the course group");

            return NoContent();
        }

        [HttpGet("{id}/teachers")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetCourseTeachers(string id)
        {
            if (!int.TryParse(id, out _))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            if (!await _courseService.CanManageCourseAsync(id, UserId) && !IsAdmin)
                return Forbid();

            var teachers = await _courseService.GetCourseTeachersAsync(id);
            return Ok(teachers);
        }

        [HttpPost("{id}/teachers")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult> AddCourseTeacher(string id, [FromBody] CourseTeacherDTO dto)
        {
            if (!int.TryParse(id, out _))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            if (!await _courseService.CanManageCourseAsync(id, UserId) && !IsAdmin)
                return Forbid();

            // Get teacher details
            var teacher = await _userManager.FindByIdAsync(dto.TeacherId);
            if (teacher == null)
                return BadRequest("Teacher not found");
                
            // Check if teacher is already the main teacher
            if (course.TeacherId == dto.TeacherId)
                return BadRequest($"{teacher.FirstName} {teacher.LastName} is already the main teacher for this course");

            var result = await _courseService.AddCourseTeacherAsync(id, dto.TeacherId);
            if (!result)
                return BadRequest("Failed to add teacher to course");

            return Ok(new { message = $"{teacher.FirstName} {teacher.LastName} has been added as a teacher to the course" });
        }

        [HttpDelete("{id}/teachers/{teacherId}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult> RemoveCourseTeacher(string id, string teacherId)
        {
            if (!int.TryParse(id, out _))
                return BadRequest("Invalid course ID format");

            var course = await _courseService.GetCourseAsync(id);
            if (course == null)
                return NotFound();

            if (!await _courseService.CanManageCourseAsync(id, UserId) && !IsAdmin)
                return Forbid();

            if (course.TeacherId == teacherId)
                return BadRequest("Cannot remove the main course teacher");

            var result = await _courseService.RemoveCourseTeacherAsync(id, teacherId);
            if (!result)
                return BadRequest("Failed to remove teacher from course");

            return NoContent();
        }
    }
}
