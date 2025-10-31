namespace TehtavaApp.API.Models;

public class SchoolGroup
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string CreatedById { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ApplicationUser CreatedBy { get; set; }
    public virtual ICollection<StudentGroupEnrollment> StudentEnrollments { get; set; }
    public virtual ICollection<Course> Courses { get; set; }

    public SchoolGroup()
    {
        StudentEnrollments = new HashSet<StudentGroupEnrollment>();
        Courses = new HashSet<Course>();
    }
}
