using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : BaseController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        ITokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDTO>> Login([FromBody] LoginRequestDTO request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return HandleUnauthorized<LoginResponseDTO>("Invalid email or password");

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
                return HandleUnauthorized<LoginResponseDTO>("Invalid email or password");

            var token = await _tokenService.GenerateTokenAsync(user);

            var response = new LoginResponseDTO
            {
                Token = token,
                User = new UserDTO
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    UserName = user.UserName ?? "",
                    FirstName = user.FirstName ?? "",
                    LastName = user.LastName ?? "",
                    Role = user.PrimaryRole ?? "Student",
                    Bio = user.Bio,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    LastActive = user.LastActive,
                    IsActive = user.IsActive,
                    PhoneNumber = user.PhoneNumber
                }
            };

            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError<LoginResponseDTO>(ex);
        }
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<UserDTO>> Register([FromBody] RegisterRequestDTO request)
    {
        try
        {
            if (!await _roleManager.RoleExistsAsync(request.Role))
                return HandleBadRequest<UserDTO>("Invalid role");
                
            // If the user is a teacher, they can only create students
            if (IsTeacher && !IsAdmin && request.Role != "Student")
                return StatusCode(StatusCodes.Status403Forbidden, "Teachers can only create student accounts");

            var user = new ApplicationUser
            {
                UserName = request.UserName,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastActive = DateTime.UtcNow,
                PrimaryRole = request.Role
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
                return HandleBadRequest<UserDTO>(result.Errors.First().Description);

            await _userManager.AddToRoleAsync(user, request.Role);

            var userDTO = new UserDTO
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Role = user.PrimaryRole ?? "Student",
                Bio = user.Bio,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastActive = user.LastActive,
                IsActive = user.IsActive,
                PhoneNumber = user.PhoneNumber
            };

            return HandleCreated(userDTO, nameof(GetProfile), new { });
        }
        catch (Exception ex)
        {
            return HandleError<UserDTO>(ex);
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserDTO>> GetProfile()
    {
        try
        {
            var user = await _userManager.FindByIdAsync(UserId);
            if (user == null)
                return HandleNotFound<UserDTO>();

            var userDTO = new UserDTO
            {
                Id = user.Id,
                Email = user.Email ?? "",
                UserName = user.UserName ?? "",
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Role = user.PrimaryRole ?? "Student",
                Bio = user.Bio,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastActive = user.LastActive,
                IsActive = user.IsActive,
                PhoneNumber = user.PhoneNumber
            };

            return HandleResult(userDTO);
        }
        catch (Exception ex)
        {
            return HandleError<UserDTO>(ex);
        }
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDTO>> UpdateProfile([FromBody] UpdateProfileRequestDTO request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(UserId);
            if (user == null)
                return HandleNotFound<UserDTO>();

            user.UserName = request.UserName;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Bio = request.Bio;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return HandleBadRequest<UserDTO>(result.Errors.First().Description);

            return await GetProfile();
        }
        catch (Exception ex)
        {
            return HandleError<UserDTO>(ex);
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequestDTO request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(UserId);
            if (user == null)
                return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors.First().Description);

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<IEnumerable<AuthUserListItemDTO>>> GetUsers()
    {
        try
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<AuthUserListItemDTO>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new AuthUserListItemDTO
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    UserName = user.UserName ?? "",
                    FirstName = user.FirstName ?? "",
                    LastName = user.LastName ?? "",
                    Role = user.PrimaryRole ?? "Student",
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastActive = user.LastActive,
                    Roles = roles.ToList()
                });
            }

            return HandleListResult(userList);
        }
        catch (Exception ex)
        {
            return HandleErrorForList<AuthUserListItemDTO>(ex);
        }
    }

    [HttpDelete("users/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound();

            if (await _userManager.IsInRoleAsync(user, "Admin"))
            {
                var adminCount = (await _userManager.GetUsersInRoleAsync("Admin")).Count;
                if (adminCount <= 1)
                    return BadRequest("Cannot delete the last admin user");
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.First().Description);

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("users/{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ChangeUserRole(string id, [FromBody] string role)
    {
        try
        {
            if (!await _roleManager.RoleExistsAsync(role))
                return BadRequest("Invalid role");

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound();

            if (await _userManager.IsInRoleAsync(user, "Admin"))
            {
                var adminCount = (await _userManager.GetUsersInRoleAsync("Admin")).Count;
                if (adminCount <= 1 && role != "Admin")
                    return BadRequest("Cannot remove the last admin user");
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, role);

            user.PrimaryRole = role;
            await _userManager.UpdateAsync(user);

            return NoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}
