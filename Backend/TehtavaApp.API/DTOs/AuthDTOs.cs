namespace TehtavaApp.API.DTOs
{
    public class LoginRequestDTO
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public bool RememberMe { get; set; }
    }

    public class LoginResponseDTO
    {
        public required string Token { get; set; }
        public required UserDTO User { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string? RefreshToken { get; set; }
    }

    public class RegisterRequestDTO
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string ConfirmPassword { get; set; }
        public required string UserName { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? Role { get; set; }
    }

    public class AuthUserDTO
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string UserName { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public required string PrimaryRole { get; set; }
        public string? Bio { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<string> Roles { get; set; } = new();
        public Dictionary<string, string> Claims { get; set; } = new();
        public Dictionary<string, bool> Permissions { get; set; } = new();
    }

    public class AuthUserListItemDTO
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string UserName { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public required string Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastActive { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    public class UpdateProfileRequestDTO
    {
        public required string UserName { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? Bio { get; set; }
        public string? PhoneNumber { get; set; }
        public Dictionary<string, string> Preferences { get; set; } = new();
    }

    public class ChangePasswordRequestDTO
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
        public required string ConfirmNewPassword { get; set; }
    }

    public class ResetPasswordDTO
    {
        public required string Email { get; set; }
        public required string Token { get; set; }
        public required string NewPassword { get; set; }
        public required string ConfirmNewPassword { get; set; }
    }

    public class ForgotPasswordDTO
    {
        public required string Email { get; set; }
    }

    public class RefreshTokenDTO
    {
        public required string RefreshToken { get; set; }
    }

    public class RoleAssignmentDTO
    {
        public required string UserId { get; set; }
        public required string Role { get; set; }
    }

    public class PermissionAssignmentDTO
    {
        public required string RoleId { get; set; }
        public required string Permission { get; set; }
        public bool IsGranted { get; set; }
    }

    public class AuthSettingsDTO
    {
        public int TokenExpirationMinutes { get; set; }
        public int RefreshTokenExpirationDays { get; set; }
        public bool RequireEmailVerification { get; set; }
        public bool AllowMultipleDevices { get; set; }
        public Dictionary<string, bool> SecuritySettings { get; set; } = new();
    }

    public class AuthActivityDTO
    {
        public string UserId { get; set; }
        public string ActivityType { get; set; }
        public DateTime Timestamp { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public Dictionary<string, string> Details { get; set; } = new();
    }
}
