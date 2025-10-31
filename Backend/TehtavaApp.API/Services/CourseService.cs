using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Data;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;
using TehtavaApp.API.DTOs;
using System.Text;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TehtavaApp.API.Extensions;
using Microsoft.AspNetCore.Identity;

namespace TehtavaApp.API.Services
{
    public class CourseService : ICourseService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public CourseService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IEnumerable<CourseListItemDTO>> GetCoursesAsync()
        {
            var courses = await _context.Courses
                .Include(c => c.Teacher)
                .Include(c => c.Groups)
                .Include(c => c.Assignments)
                .ToListAsync();

            var result = new List<CourseListItemDTO>();
            
            foreach (var c in courses)
            {
                var students = await c.StudentsAsync(_context);
                result.Add(new CourseListItemDTO
                {
                    Id = c.Id.ToString(),
                    Name = c.Name,
                    Description = c.Description,
                    TeacherName = c.Teacher?.FullName ?? string.Empty,
                    Status = c.IsActive ? "Active" : "Inactive",
                    EnrollmentCount = students.Count(),
                    AssignmentCount = c.Assignments.Count,
                    StudentCount = students.Count(),
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    IsActive = c.IsActive,
                    LastActivity = c.UpdatedAt
                });
            }
            
            return result;
        }

        public async Task<CourseDTO> GetCourseAsync(string id)
        {
            if (!int.TryParse(id, out int courseId))
                return null;

            Console.WriteLine($"CourseService: Getting course with ID {id}");
            
            var course = await _context.Courses
                .Include(c => c.Teacher)
                .Include(c => c.CourseTeachers)
                    .ThenInclude(ct => ct.Teacher)
                .Include(c => c.Groups)
                .Include(c => c.Assignments)
                .Include(c => c.Materials)
                    .ThenInclude(m => m.CreatedBy)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return null;

            Console.WriteLine($"CourseService: Found course {course.Name}");
            
            var students = await course.StudentsAsync(_context);
            
            // Get all teachers (main teacher + additional teachers)
            var teachers = new List<UserDTO>();
            
            // Add main teacher
            teachers.Add(new UserDTO
            {
                Id = course.Teacher.Id,
                UserName = course.Teacher.UserName,
                Email = course.Teacher.Email,
                FirstName = course.Teacher.FirstName,
                LastName = course.Teacher.LastName,
                Role = "Teacher",
                IsMainTeacher = true
            });
            
            // Add additional teachers
            foreach (var courseTeacher in course.CourseTeachers)
            {
                // Skip if this is the main teacher (already added)
                if (courseTeacher.TeacherId == course.TeacherId)
                    continue;
                    
                teachers.Add(new UserDTO
                {
                    Id = courseTeacher.Teacher.Id,
                    UserName = courseTeacher.Teacher.UserName,
                    Email = courseTeacher.Teacher.Email,
                    FirstName = courseTeacher.Teacher.FirstName,
                    LastName = courseTeacher.Teacher.LastName,
                    Role = "Teacher",
                    IsMainTeacher = false
                });
            }
            
            var courseDto = new CourseDTO
            {
                Id = course.Id.ToString(),
                Name = course.Name,
                Description = course.Description,
                TeacherId = course.TeacherId,
                TeacherName = $"{course.Teacher.FirstName} {course.Teacher.LastName}",
                StartDate = course.StartDate,
                EndDate = course.EndDate,
                IsActive = course.IsActive,
                EnrollmentCount = students.Count(),
                AssignmentCount = course.Assignments.Count(),
                MaterialCount = course.Materials.Count(),
                StudentCount = students.Count(),
                Students = students.Select(s => new UserListItemDTO
                {
                    Id = s.Id,
                    UserName = s.UserName,
                    Email = s.Email,
                    FirstName = s.FirstName,
                    LastName = s.LastName,
                    Role = "Student",
                    IsActive = s.IsActive
                }).ToList(),
                Teachers = teachers,
                Assignments = course.Assignments.Select(a => new AssignmentListItemDTO
                {
                    Id = a.Id.ToString(),
                    CourseId = a.CourseId.ToString(),
                    Title = a.Title,
                    Description = a.Description,
                    DueDate = a.DueDate,
                    Status = a.Status.ToString()
                }).ToList(),
                Materials = course.Materials.Select(m => new MaterialListItemDTO
                {
                    Id = m.Id.ToString(),
                    Title = m.Title,
                    Description = m.Description,
                    Type = m.Type,
                    FileType = m.FileType,
                    FileUrl = m.FileUrl,
                    CreatedById = m.CreatedById,
                    CreatedByName = $"{m.CreatedBy.FirstName} {m.CreatedBy.LastName}"
                }).ToList(),
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt
            };
            
            // Parse ContentBlocksJson if it exists
            if (!string.IsNullOrEmpty(course.ContentBlocksJson))
            {
                try
                {
                    Console.WriteLine($"CourseService: Deserializing content blocks JSON: {course.ContentBlocksJson.Substring(0, Math.Min(100, course.ContentBlocksJson.Length))}...");
                    courseDto.ContentBlocks = System.Text.Json.JsonSerializer.Deserialize<List<object>>(course.ContentBlocksJson);
                    Console.WriteLine($"CourseService: Successfully deserialized {courseDto.ContentBlocks?.Count ?? 0} content blocks");
                    
                    // Check for assignment blocks
                    if (courseDto.ContentBlocks != null)
                    {
                        // Use Json serialization to check block types
                        var jsonOptions = new System.Text.Json.JsonSerializerOptions 
                        { 
                            PropertyNameCaseInsensitive = true 
                        };
                        
                        int assignmentBlockCount = 0;
                        int textBlockCount = 0;
                        int materialBlockCount = 0;
                        int markdownBlockCount = 0;
                        int otherBlockCount = 0;
                        
                        foreach (var block in courseDto.ContentBlocks)
                        {
                            try
                            {
                                // Convert to JsonElement to safely check properties
                                if (block is System.Text.Json.JsonElement element)
                                {
                                    if (element.TryGetProperty("type", out var typeProperty))
                                    {
                                        string type = typeProperty.GetString() ?? "";
                                        
                                        switch (type.ToLower())
                                        {
                                            case "assignment":
                                                assignmentBlockCount++;
                                                // Log assignment block details
                                                if (element.TryGetProperty("id", out var idProperty) && 
                                                    element.TryGetProperty("title", out var titleProperty))
                                                {
                                                    string blockId = idProperty.GetString() ?? "";
                                                    string title = titleProperty.GetString() ?? "";
                                                    
                                                    string assignmentId = "";
                                                    if (element.TryGetProperty("assignmentId", out var assignmentIdProperty))
                                                    {
                                                        assignmentId = assignmentIdProperty.GetString() ?? "";
                                                    }
                                                    
                                                    Console.WriteLine($"CourseService: Found assignment block - ID: {blockId}, Title: {title}, AssignmentID: {assignmentId}");
                                                }
                                                break;
                                            case "text":
                                                textBlockCount++;
                                                break;
                                            case "material":
                                                materialBlockCount++;
                                                break;
                                            case "markdown":
                                                markdownBlockCount++;
                                                break;
                                            default:
                                                otherBlockCount++;
                                                break;
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"CourseService: Error processing block: {ex.Message}");
                            }
                        }
                        
                        Console.WriteLine($"CourseService: Block counts - Assignment: {assignmentBlockCount}, Text: {textBlockCount}, Material: {materialBlockCount}, Markdown: {markdownBlockCount}, Other: {otherBlockCount}");
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue
                    Console.WriteLine($"CourseService: Error deserializing content blocks: {ex.Message}");
                    Console.WriteLine($"CourseService: Exception detail: {ex}");
                }
            }
            else
            {
                Console.WriteLine("CourseService: Course has no content blocks JSON");
            }
            
            return courseDto;
        }

        public async Task<CourseDTO> CreateCourseAsync(Course course)
        {
            course.CreatedAt = DateTime.UtcNow;
            course.UpdatedAt = DateTime.UtcNow;
            course.IsActive = true;
            
            // We'll handle ContentBlocksJson in the controller

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return await GetCourseAsync(course.Id.ToString());
        }

        public async Task<CourseDTO> UpdateCourseAsync(Course course)
        {
            var existingCourse = await _context.Courses
                .Include(c => c.Teacher)
                .FirstOrDefaultAsync(c => c.Id == course.Id);

            if (existingCourse == null)
                return null;

            // Preserve ContentBlocksJson if not being updated
            if (string.IsNullOrEmpty(course.ContentBlocksJson))
            {
                course.ContentBlocksJson = existingCourse.ContentBlocksJson;
            }

            // Preserve required fields if they're missing in the update
            if (string.IsNullOrEmpty(course.Code))
            {
                course.Code = existingCourse.Code;
            }

            course.UpdatedAt = DateTime.UtcNow;
            course.CreatedAt = existingCourse.CreatedAt;
            
            // Log the content blocks before update for debugging
            Console.WriteLine($"Updating course {course.Id} with ContentBlocksJson: {course.ContentBlocksJson?.Substring(0, Math.Min(100, course.ContentBlocksJson?.Length ?? 0))}...");
            
            _context.Entry(existingCourse).CurrentValues.SetValues(course);
            await _context.SaveChangesAsync();

            return await GetCourseAsync(course.Id.ToString());
        }

        public async Task DeleteCourseAsync(string id)
        {
            if (!int.TryParse(id, out int courseId))
                return;

            var course = await _context.Courses.FindAsync(courseId);
            if (course != null)
            {
                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> CanManageCourseAsync(string courseId, string userId)
        {
            if (!int.TryParse(courseId, out int cId))
                return false;

            // Check if user is admin (admins can manage all courses)
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
                return true;

            var course = await _context.Courses
                .Include(c => c.Teacher)
                .FirstOrDefaultAsync(c => c.Id == cId);
                
            if (course?.TeacherId == userId)
                return true;
                
            // Check if user is an additional teacher
            var isAdditionalTeacher = await _context.CourseTeachers
                .AnyAsync(ct => ct.CourseId == cId && ct.TeacherId == userId);
                
            return isAdditionalTeacher;
        }

        public async Task<CourseDetailDTO> GetCourseDetailAsync(string courseId, string userId)
        {
            if (!int.TryParse(courseId, out int cId))
                return null;

            var course = await _context.Courses
                .Include(c => c.Teacher)
                .Include(c => c.Assignments)
                .Include(c => c.Materials)
                .Include(c => c.Groups)
                .FirstOrDefaultAsync(c => c.Id == cId);

            if (course == null)
                return null;

            // Haetaan kurssin opiskelijat ryhmien kautta
            var students = await course.StudentsAsync(_context);
            var studentCount = students.Count();

            // Haetaan tehtävien palautukset
            var submissions = await _context.AssignmentSubmissions
                .Include(s => s.Assignment)
                .Where(s => s.Assignment.CourseId == cId)
                .ToListAsync();

            var inProgressSubmissions = submissions.Where(s => s.Status == AssignmentStatus.Submitted.ToString()).ToList();
            var gradedSubmissions = submissions.Where(s => s.Status == AssignmentStatus.Completed.ToString()).ToList();
            var validGrades = gradedSubmissions.Where(s => s.Grade.HasValue).Select(s => s.Grade.Value);

            return new CourseDetailDTO
            {
                Id = course.Id.ToString(),
                Name = course.Name,
                Description = course.Description,
                TeacherName = $"{course.Teacher.FirstName} {course.Teacher.LastName}",
                TeacherId = course.TeacherId,
                StartDate = course.StartDate,
                EndDate = course.EndDate,
                IsActive = course.IsActive,
                StudentCount = studentCount,
                AssignmentCount = course.Assignments.Count(),
                SubmissionCount = submissions.Count(),
                GradedCount = gradedSubmissions.Count(),
                PendingAssignments = inProgressSubmissions.Count(),
                AverageGrade = validGrades.Any() ? Math.Round(validGrades.Average(), 2) : 0.0,
                ActivityByWeek = GetActivityByWeek(course),
                GradeDistribution = GetGradeDistribution(submissions)
            };
        }

        public async Task<CourseStatsDTO> GetCourseStatsAsync(string id)
        {
            if (!int.TryParse(id, out int courseId))
                return null;

            var course = await _context.Courses
                .Include(c => c.Assignments)
                    .ThenInclude(a => a.Submissions)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return null;

            // Haetaan kurssin opiskelijat ryhmien kautta
            var students = await course.StudentsAsync(_context);
            var activeStudents = students.Count();

            var submissions = course.Assignments
                .SelectMany(a => a.Submissions)
                .ToList();

            var completedSubmissions = submissions.Where(s => s.Status == AssignmentStatus.Completed.ToString()).ToList();
            var inProgressSubmissions = submissions.Where(s => s.Status == AssignmentStatus.Submitted.ToString()).ToList();
            var validGrades = submissions.Where(s => s.Grade.HasValue).Select(s => s.Grade.Value).ToList();

            return new CourseStatsDTO
            {
                TotalStudents = activeStudents,
                ActiveStudents = activeStudents,
                CompletedAssignments = completedSubmissions.Count(),
                PendingAssignments = inProgressSubmissions.Count(),
                AverageGrade = validGrades.Any() ? Math.Round(validGrades.Average(), 2) : 0.0,
                ActivityByWeek = GetActivityByWeek(course),
                GradeDistribution = GetGradeDistribution(submissions)
            };
        }

        public async Task<IEnumerable<CourseListItemDTO>> GetUserCoursesAsync(string userId)
        {
            // Haetaan kurssit, joihin opiskelija kuuluu ryhmien kautta
            var courses = await _context.SchoolGroups
                .Include(g => g.StudentEnrollments)
                .Include(g => g.Courses)
                    .ThenInclude(c => c.Teacher)
                .Include(g => g.Courses)
                    .ThenInclude(c => c.Assignments)
                .Where(g => g.StudentEnrollments.Any(se => se.StudentId == userId && se.Status == EnrollmentStatus.Active))
                .SelectMany(g => g.Courses)
                .Distinct()
                .ToListAsync();

            return courses.Select(c => new CourseListItemDTO
            {
                Id = c.Id.ToString(),
                Name = c.Name,
                Description = c.Description,
                TeacherName = $"{c.Teacher.FirstName} {c.Teacher.LastName}",
                Status = c.IsActive ? "Active" : "Inactive",
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                IsActive = c.IsActive,
                AssignmentCount = c.Assignments.Count(),
                StudentCount = GetCourseStudentCount(c.Id),
                LastActivity = c.UpdatedAt
            });
        }

        // Apumetodi opiskelijoiden määrän laskemiseen kurssilla
        private int GetCourseStudentCount(int courseId)
        {
            return _context.SchoolGroups
                .Include(g => g.StudentEnrollments)
                .Where(g => g.Courses.Any(c => c.Id == courseId))
                .SelectMany(g => g.StudentEnrollments)
                .Select(se => se.StudentId)
                .Distinct()
                .Count();
        }

        public async Task<IEnumerable<CourseListItemDTO>> GetTeachingCoursesAsync(string userId)
        {
            var courses = await _context.Courses
                .Include(c => c.Teacher)
                .Include(c => c.Groups)
                .Include(c => c.Assignments)
                .Where(c => c.TeacherId == userId)
                .ToListAsync();

            var result = new List<CourseListItemDTO>();
            
            foreach (var c in courses)
            {
                var students = await c.StudentsAsync(_context);
                result.Add(new CourseListItemDTO
                {
                    Id = c.Id.ToString(),
                    Name = c.Name,
                    Description = c.Description,
                    TeacherName = $"{c.Teacher.FirstName} {c.Teacher.LastName}",
                    Status = c.IsActive ? "Active" : "Inactive",
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    IsActive = c.IsActive,
                    EnrollmentCount = students.Count(),
                    AssignmentCount = c.Assignments.Count(),
                    StudentCount = students.Count(),
                    LastActivity = c.UpdatedAt
                });
            }
            
            return result;
        }

        private Dictionary<string, int> GetActivityByWeek(Course course)
        {
            var startDate = course.StartDate;
            var endDate = course.EndDate ?? DateTime.UtcNow;
            var weeks = new Dictionary<string, int>();

            for (var date = startDate; date <= endDate; date = date.AddDays(7))
            {
                var weekKey = $"{date:yyyy-MM-dd}";
                var activityCount = course.Assignments
                    .SelectMany(a => a.Submissions)
                    .Count(s => s.SubmittedAt.Date >= date && s.SubmittedAt.Date < date.AddDays(7));
                weeks[weekKey] = activityCount;
            }

            return weeks;
        }

        private Dictionary<string, double> GetGradeDistribution(IEnumerable<AssignmentSubmission> submissions)
        {
            var gradeRanges = new Dictionary<string, double>
            {
                {"90-100", 0},
                {"80-89", 0},
                {"70-79", 0},
                {"60-69", 0},
                {"0-59", 0}
            };

            var grades = submissions
                .Where(s => s.Grade.HasValue)
                .Select(s => s.Grade.Value)
                .ToList();

            foreach (var grade in grades)
            {
                var key = grade switch
                {
                    >= 90 => "90-100",
                    >= 80 => "80-89",
                    >= 70 => "70-79",
                    >= 60 => "60-69",
                    _ => "0-59"
                };
                gradeRanges[key]++;
            }

            var total = grades.Count();
            if (total > 0)
            {
                foreach (var key in gradeRanges.Keys.ToList())
                {
                    gradeRanges[key] = Math.Round(gradeRanges[key] / total * 100, 2);
                }
            }

            return gradeRanges;
        }

        public async Task<IEnumerable<SchoolGroup>> GetCourseGroupsAsync(string courseId)
        {
            if (!int.TryParse(courseId, out int cId))
            {
                Console.WriteLine($"DEBUG: Virheellinen kurssin ID: {courseId}");
                return new List<SchoolGroup>();
            }

            try
            {
                Console.WriteLine($"DEBUG: Haetaan ryhmiä kurssille {cId}");

                // Haetaan kurssi ja siihen liitetyt ryhmät
                var course = await _context.Courses
                    .Include(c => c.Groups)
                        .ThenInclude(g => g.StudentEnrollments)
                    .FirstOrDefaultAsync(c => c.Id == cId);

                if (course == null)
                {
                    Console.WriteLine($"DEBUG: Kurssia ei löydy ID:llä {cId}");
                    return new List<SchoolGroup>();
                }

                var groups = course.Groups.ToList();

                Console.WriteLine($"DEBUG: Löydettiin {groups.Count} ryhmää kurssille {courseId}");

                // Varmistetaan, että kaikki tarvittavat tiedot ovat mukana
                foreach (var group in groups)
                {
                    Console.WriteLine($"DEBUG: Käsitellään ryhmää {group.Id} - {group.Name}");
                    
                    // Varmistetaan, että StudentEnrollments on alustettu
                    if (group.StudentEnrollments == null)
                    {
                        group.StudentEnrollments = new List<StudentGroupEnrollment>();
                    }
                }

                return groups;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Virhe haettaessa ryhmiä kurssille {courseId}: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);
                return new List<SchoolGroup>();
            }
        }

        public async Task<bool> ExportCourseMaterialsAsync(int courseId, string format)
        {
            var course = await _context.Courses
                .Include(c => c.Materials)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null || !course.Materials.Any())
                return false;

            var exportPath = Path.Combine("Exports");
            Directory.CreateDirectory(exportPath);

            // Create a zip file containing all course materials
            string fileName = $"Course_{courseId}_Materials.zip";
            string fullPath = Path.Combine(exportPath, fileName);

            using (var archive = ZipFile.Open(fullPath, ZipArchiveMode.Create))
            {
                foreach (var material in course.Materials)
                {
                    if (string.IsNullOrEmpty(material.FileUrl))
                        continue;

                    try
                    {
                        using var client = new HttpClient();
                        var bytes = await client.GetByteArrayAsync(material.FileUrl);
                        var entry = archive.CreateEntry($"{material.Title}_{Path.GetFileName(material.FileUrl)}");
                        using var entryStream = entry.Open();
                        await entryStream.WriteAsync(bytes, 0, bytes.Length);
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue with other materials
                        Console.WriteLine($"Error processing material {material.FileUrl}: {ex.Message}");
                    }
                }

                // Add a manifest file with course and material details
                var manifestEntry = archive.CreateEntry("manifest.txt");
                using var writer = new StreamWriter(manifestEntry.Open());
                writer.WriteLine($"Course: {course.Name}");
                writer.WriteLine($"Description: {course.Description}");
                writer.WriteLine($"Start Date: {course.StartDate:yyyy-MM-dd}");
                if (course.EndDate.HasValue)
                    writer.WriteLine($"End Date: {course.EndDate:yyyy-MM-dd}");
                writer.WriteLine("\nMaterials:");
                foreach (var material in course.Materials)
                {
                    writer.WriteLine($"\nTitle: {material.Title}");
                    writer.WriteLine($"Description: {material.Description}");
                    writer.WriteLine($"Type: {material.Type}");
                    if (!string.IsNullOrEmpty(material.FileUrl))
                        writer.WriteLine($"Original URL: {material.FileUrl}");
                }
            }

            return true;
        }

        public async Task<IEnumerable<UserDTO>> GetCourseStudentsAsync(string courseId)
        {
            if (!int.TryParse(courseId, out int cId))
                return null;

            var course = await _context.Courses.FindAsync(cId);
            if (course == null)
                return null;

            // Haetaan kurssin opiskelijat ryhmien kautta
            var students = await course.StudentsAsync(_context);

            return students.Select(s => new UserDTO
            {
                Id = s.Id,
                FirstName = s.FirstName,
                LastName = s.LastName,
                Email = s.Email,
                UserName = s.UserName,
                Role = "Student"
            });
        }

        public async Task<IEnumerable<UserDTO>> GetCourseTeachersAsync(string courseId)
        {
            if (!int.TryParse(courseId, out int cId))
                return new List<UserDTO>();

            // Get the main teacher
            var mainTeacher = await _context.Courses
                .Include(c => c.Teacher)
                .Where(c => c.Id == cId)
                .Select(c => c.Teacher)
                .FirstOrDefaultAsync();

            var mainTeacherDto = mainTeacher == null ? null : new UserDTO
            {
                Id = mainTeacher.Id,
                UserName = mainTeacher.UserName,
                Email = mainTeacher.Email,
                FirstName = mainTeacher.FirstName,
                LastName = mainTeacher.LastName,
                Role = "Teacher"
            };

            // Get additional teachers
            var additionalTeachers = await _context.CourseTeachers
                .Where(ct => ct.CourseId == cId)
                .Include(ct => ct.Teacher)
                .Select(ct => new UserDTO
                {
                    Id = ct.Teacher.Id,
                    UserName = ct.Teacher.UserName,
                    Email = ct.Teacher.Email,
                    FirstName = ct.Teacher.FirstName,
                    LastName = ct.Teacher.LastName,
                    Role = "Teacher"
                })
                .ToListAsync();

            var result = new List<UserDTO>();
            if (mainTeacherDto != null)
            {
                result.Add(mainTeacherDto);
            }
            result.AddRange(additionalTeachers);

            return result;
        }

        public async Task<bool> AddCourseTeacherAsync(string courseId, string teacherId)
        {
            if (!int.TryParse(courseId, out int cId))
                return false;

            // Check if the course exists
            var course = await _context.Courses.FindAsync(cId);
            if (course == null)
                return false;

            // Check if the user exists and is a teacher
            var teacher = await _context.Users.FindAsync(teacherId);
            if (teacher == null)
                return false;

            // Don't add if user is already the main teacher
            if (course.TeacherId == teacherId)
                return false;

            // Check if the relationship already exists
            var existingRelation = await _context.CourseTeachers
                .FirstOrDefaultAsync(ct => ct.CourseId == cId && ct.TeacherId == teacherId);
            
            if (existingRelation != null)
                return true; // Already exists, consider it a success

            // Create the new relationship
            var courseTeacher = new CourseTeacher
            {
                CourseId = cId,
                TeacherId = teacherId
            };

            _context.CourseTeachers.Add(courseTeacher);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveCourseTeacherAsync(string courseId, string teacherId)
        {
            if (!int.TryParse(courseId, out int cId))
                return false;

            // Find the relationship
            var relation = await _context.CourseTeachers
                .FirstOrDefaultAsync(ct => ct.CourseId == cId && ct.TeacherId == teacherId);
            
            if (relation == null)
                return false; // Relationship doesn't exist

            _context.CourseTeachers.Remove(relation);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DoesCourseExistAsync(int courseId)
        {
            return await _context.Courses.AnyAsync(c => c.Id == courseId);
        }
    }
}
