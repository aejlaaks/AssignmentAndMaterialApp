using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TehtavaApp.API.Models
{
    public class StudentCourseEnrollment
    {
        public int Id { get; set; }
        
        [Required]
        public string StudentId { get; set; }
        
        [Required]
        public int CourseId { get; set; }
        
        public DateTime EnrollmentDate { get; set; }
        
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
        
        // Navigation properties
        public virtual ApplicationUser Student { get; set; }
        public virtual Course Course { get; set; }
        
        public StudentCourseEnrollment()
        {
            EnrollmentDate = DateTime.UtcNow;
        }
    }
} 