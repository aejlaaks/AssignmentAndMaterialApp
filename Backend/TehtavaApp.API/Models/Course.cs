namespace TehtavaApp.API.Models
{
    public class Course
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Code { get; set; }
        public string TeacherId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string ContentBlocksJson { get; set; }

        // Navigation properties
        public ApplicationUser Teacher { get; set; }
        public ICollection<Assignment> Assignments { get; set; }
        public ICollection<Material> Materials { get; set; }
        public ICollection<SchoolGroup> Groups { get; set; }
        public ICollection<CourseTeacher> CourseTeachers { get; set; }

        public Course()
        {
            Assignments = new HashSet<Assignment>();
            Materials = new HashSet<Material>();
            Groups = new HashSet<SchoolGroup>();
            CourseTeachers = new HashSet<CourseTeacher>();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            IsActive = true;
        }
    }
}
