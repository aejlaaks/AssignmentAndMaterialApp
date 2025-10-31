using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.Models;
using Backend.Models;

namespace TehtavaApp.API.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Course> Courses { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<AssignmentSubmission> AssignmentSubmissions { get; set; }
        public DbSet<Material> Materials { get; set; }
        public DbSet<SchoolGroup> SchoolGroups { get; set; }
        public DbSet<StudentGroupEnrollment> StudentGroupEnrollments { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<NotificationPreference> NotificationPreferences { get; set; }
        public DbSet<PushNotificationToken> PushNotificationTokens { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<CourseTeacher> CourseTeachers { get; set; }
        public DbSet<UploadedFile> UploadedFiles { get; set; }
        public DbSet<CourseGrade> CourseGrades { get; set; }
        public DbSet<Test> Tests { get; set; }
        public DbSet<TestQuestion> TestQuestions { get; set; }
        public DbSet<TestQuestionOption> TestQuestionOptions { get; set; }
        public DbSet<TestAttempt> TestAttempts { get; set; }
        public DbSet<TestAnswer> TestAnswers { get; set; }
        public DbSet<TestCase> TestCases { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Course relationships
            builder.Entity<Course>()
                .HasOne(c => c.Teacher)
                .WithMany(u => u.TeachingCourses)
                .HasForeignKey(c => c.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            // Group relationships
            builder.Entity<StudentGroupEnrollment>()
                .HasOne(ge => ge.Student)
                .WithMany(u => u.GroupEnrollments)
                .HasForeignKey(ge => ge.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<StudentGroupEnrollment>()
                .HasOne(ge => ge.Group)
                .WithMany(g => g.StudentEnrollments)
                .HasForeignKey(ge => ge.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            // Assignment relationships
            builder.Entity<Assignment>()
                .HasOne(a => a.Course)
                .WithMany(c => c.Assignments)
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Assignment>()
                .HasOne(a => a.CreatedBy)
                .WithMany(u => u.CreatedAssignments)
                .HasForeignKey(a => a.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Assignment>()
                .HasOne(a => a.GradedBy)
                .WithMany()
                .HasForeignKey(a => a.GradedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Assignment Submission relationships
            builder.Entity<AssignmentSubmission>()
                .HasOne(s => s.Assignment)
                .WithMany(a => a.Submissions)
                .HasForeignKey(s => s.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AssignmentSubmission>()
                .HasOne(s => s.Student)
                .WithMany(u => u.AssignmentSubmissions)
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<AssignmentSubmission>()
                .HasOne(s => s.GradedBy)
                .WithMany()
                .HasForeignKey(s => s.GradedById)
                .OnDelete(DeleteBehavior.Restrict);

            // CourseGrade relationships
            builder.Entity<CourseGrade>()
                .HasOne(cg => cg.Course)
                .WithMany()
                .HasForeignKey(cg => cg.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<CourseGrade>()
                .HasOne(cg => cg.Student)
                .WithMany()
                .HasForeignKey(cg => cg.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<CourseGrade>()
                .HasOne(cg => cg.GradedBy)
                .WithMany()
                .HasForeignKey(cg => cg.GradedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Material relationships
            builder.Entity<Material>()
                .HasOne(m => m.Course)
                .WithMany(c => c.Materials)
                .HasForeignKey(m => m.CourseId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Material>()
                .HasOne(m => m.CreatedBy)
                .WithMany(u => u.CreatedMaterials)
                .HasForeignKey(m => m.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification relationships
            builder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<NotificationPreference>()
                .HasOne(np => np.User)
                .WithMany(u => u.NotificationPreferences)
                .HasForeignKey(np => np.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure many-to-many relationship between Course and SchoolGroup
            builder.Entity<Course>()
                .HasMany(c => c.Groups)
                .WithMany(g => g.Courses);

            // SchoolGroup relationships
            builder.Entity<SchoolGroup>()
                .HasOne(g => g.CreatedBy)
                .WithMany()
                .HasForeignKey(g => g.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Assignment property configurations
            builder.Entity<Assignment>()
                .Property(a => a.Grade)
                .HasMaxLength(50)
                .IsRequired(false);

            builder.Entity<Assignment>()
                .Property(a => a.FeedbackText)
                .HasMaxLength(2000)
                .IsRequired(false);

            builder.Entity<Assignment>()
                .Property(a => a.GradedById)
                .IsRequired(false);

            builder.Entity<Assignment>()
                .Property(a => a.Status)
                .HasMaxLength(50)
                .IsRequired();

            builder.Entity<Assignment>()
                .Property(a => a.RequiresRevision)
                .HasDefaultValue(false);

            // CourseTeacher relationships
            builder.Entity<CourseTeacher>()
                .HasOne(ct => ct.Course)
                .WithMany(c => c.CourseTeachers)
                .HasForeignKey(ct => ct.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<CourseTeacher>()
                .HasOne(ct => ct.Teacher)
                .WithMany(u => u.CoursesAsTeacher)
                .HasForeignKey(ct => ct.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            // Test-related entity configurations
            builder.Entity<Test>()
                .HasMany(t => t.Questions)
                .WithOne(q => q.Test)
                .HasForeignKey(q => q.TestId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Test>()
                .HasMany(t => t.TestAttempts)
                .WithOne(a => a.Test)
                .HasForeignKey(a => a.TestId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TestQuestion>()
                .HasMany(q => q.Options)
                .WithOne()
                .HasForeignKey("QuestionId")
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<TestAttempt>()
                .HasMany(a => a.Answers)
                .WithOne(ans => ans.TestAttempt)
                .HasForeignKey(ans => ans.TestAttemptId)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent circular dependency by using NoAction
            builder.Entity<TestAnswer>()
                .HasOne(ans => ans.Question)
                .WithMany()
                .HasForeignKey(ans => ans.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);
                
            // Fix incorrect mapping of TestQuestionOption
            builder.Entity<TestQuestionOption>()
                .HasOne(o => o.Question)
                .WithMany(q => q.Options)
                .HasForeignKey(o => o.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            // UploadedFile relationships
            builder.Entity<UploadedFile>()
                .HasOne(f => f.Assignment)
                .WithMany(a => a.Files)
                .HasForeignKey(f => f.AssignmentId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<UploadedFile>()
                .HasOne(f => f.Material)
                .WithMany(m => m.Files)
                .HasForeignKey(f => f.MaterialId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
