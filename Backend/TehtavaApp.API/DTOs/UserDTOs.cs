namespace TehtavaApp.API.DTOs;

public class UserDTO
{
    public required string Id { get; set; }
    public required string Email { get; set; }
    public required string UserName { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}";
    public required string Role { get; set; } // Changed from PrimaryRole to Role
    public string? Bio { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public bool IsMainTeacher { get; set; } = false; // Indicates if this is the main teacher for a course
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime LastActive { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class UserListItemDTO
{
    public required string Id { get; set; }
    public required string Email { get; set; }
    public required string UserName { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}";
    public required string Role { get; set; } // Changed from PrimaryRole to Role
    public bool IsActive { get; set; }
    public int CourseCount { get; set; }
    public int GroupCount { get; set; }
    public DateTime LastActive { get; set; }
}

public class UserSearchResultDTO
{
    public required string Id { get; set; }
    public required string Email { get; set; }
    public required string UserName { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}";
    public required string Role { get; set; } // Changed from PrimaryRole to Role
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Groups { get; set; } = new();
    public List<string> Courses { get; set; } = new();
}

public class UserResponseDTO
{
    public required string Id { get; set; }
    public required string Email { get; set; }
    public required string UserName { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string FullName => $"{FirstName} {LastName}";
    public required string Role { get; set; } // Changed from PrimaryRole to Role
    public string? Bio { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<UserCourseDTO> TeachingCourses { get; set; } = new();
    public List<UserCourseDTO> EnrolledCourses { get; set; } = new();
    public List<UserGroupDTO> Groups { get; set; } = new();
}

public class UserUpdateDTO
{
    public required string Id { get; set; }
    public required string Email { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? Bio { get; set; }
    public string? PhoneNumber { get; set; }
}

public class UserCourseDTO
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
    public int StudentCount { get; set; }
}

public class UserGroupDTO
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int MemberCount { get; set; }
    public int StudentCount { get; set; }
}
