using System.ComponentModel.DataAnnotations.Schema;

namespace TehtavaApp.API.Models;

public class StudentGroupEnrollment
{
    public int Id { get; set; }
    public string StudentId { get; set; }
    public int GroupId { get; set; }
    public EnrollmentStatus Status { get; set; }
    public DateTime EnrolledAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Kurssiin liittyvät tiedot (ei tallenneta tietokantaan)
    [NotMapped]
    public int? CourseId { get; set; }
    
    [NotMapped]
    public int? CourseEnrollmentId { get; set; }
    
    [NotMapped]
    public EnrollmentStatus? CourseEnrollmentStatus { get; set; }
    
    [NotMapped]
    public DateTime? CourseEnrollmentDate { get; set; }

    // Navigation properties
    public virtual ApplicationUser Student { get; set; }
    public virtual SchoolGroup Group { get; set; }

    public StudentGroupEnrollment()
    {
        EnrolledAt = DateTime.UtcNow;
        Status = EnrollmentStatus.Active;
    }
}
