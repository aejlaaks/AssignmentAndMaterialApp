namespace TehtavaApp.API.DTOs
{
    public class UserActivityReportDTO
    {
        public required string UserId { get; set; }
        public required string UserName { get; set; }
        public int ActiveCourses { get; set; }
        public int CompletedAssignments { get; set; }
        public int PendingAssignments { get; set; }
        // Add other properties as necessary
    }
}
