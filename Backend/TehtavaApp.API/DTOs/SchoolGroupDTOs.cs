namespace TehtavaApp.API.DTOs
{
    public class SchoolGroupDTO
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        public required string CreatedById { get; set; }
        public required string CreatedByName { get; set; }
        public bool IsActive { get; set; }
        public int MemberCount { get; set; }
        public int StudentCount { get; set; }
        public int CourseCount { get; set; }
        public List<GroupMemberDTO> Members { get; set; } = new();
        public List<GroupCourseDTO> Courses { get; set; } = new();
        public Dictionary<string, string> Metadata { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SchoolGroupListItemDTO
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        public required string CreatedByName { get; set; }
        public bool IsActive { get; set; }
        public int MemberCount { get; set; }
        public int StudentCount { get; set; }
        public int CourseCount { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class SchoolGroupCreateDTO
    {
        public required string Name { get; set; }
        public required string Description { get; set; }
        public List<string> MemberIds { get; set; } = new();
        public List<string> CourseIds { get; set; } = new();
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class SchoolGroupUpdateDTO
    {
        public required string Name { get; set; }
        public required string Description { get; set; }
        public bool IsActive { get; set; }
        public List<string> MemberIds { get; set; } = new();
        public List<string> CourseIds { get; set; } = new();
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class GroupMemberDTO
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string UserName { get; set; }
        public DateTime JoinedAt { get; set; }
        public bool IsActive { get; set; }
        public required string Role { get; set; }
        public int AssignmentCount { get; set; }
        public double CompletionRate { get; set; }
    }

    public class GroupCourseDTO
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string TeacherName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; }
        public int EnrollmentCount { get; set; }
        public int StudentCount { get; set; }
    }

    public class GroupMembershipDTO
    {
        public required string GroupId { get; set; }
        public required string UserId { get; set; }
        public required string Role { get; set; }
        public DateTime JoinedAt { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class GroupStatsDTO
    {
        public int TotalMembers { get; set; }
        public int ActiveMembers { get; set; }
        public int TotalCourses { get; set; }
        public int ActiveCourses { get; set; }
        public double AverageAttendance { get; set; }
        public Dictionary<string, int> ActivityByMonth { get; set; } = new();
        public Dictionary<string, double> PerformanceMetrics { get; set; } = new();
    }

    public class GroupEnrollmentDTO
    {
        public required string GroupId { get; set; }
        public required string StudentId { get; set; }
        public required string Role { get; set; }
        public DateTime EnrolledAt { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class GroupActivityDTO
    {
        public required string GroupId { get; set; }
        public required string ActivityType { get; set; }
        public DateTime Timestamp { get; set; }
        public string? UserId { get; set; }
        public string? CourseId { get; set; }
        public Dictionary<string, string> Details { get; set; } = new();
    }
}
