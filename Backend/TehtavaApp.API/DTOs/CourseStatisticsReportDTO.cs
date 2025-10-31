namespace TehtavaApp.API.DTOs
{
    public class CourseStatisticsReportDTO
    {
        public int CourseId { get; set; }
        public required string CourseName { get; set; }
        public required int EnrolledStudents { get; set; }
        public required int CompletedAssignments { get; set; }
        public required int PendingAssignments { get; set; }
        // Add other properties as necessary
    }
}
