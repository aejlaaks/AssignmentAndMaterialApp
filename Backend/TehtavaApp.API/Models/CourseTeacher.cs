namespace TehtavaApp.API.Models
{
    public class CourseTeacher
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string TeacherId { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public Course Course { get; set; }
        public ApplicationUser Teacher { get; set; }
        
        public CourseTeacher()
        {
            CreatedAt = DateTime.UtcNow;
        }
    }
} 