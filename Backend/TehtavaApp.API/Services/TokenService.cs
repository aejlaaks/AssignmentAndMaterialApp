using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services
{
    public class TokenService : ITokenService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public TokenService(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<string> GenerateTokenAsync(ApplicationUser user)
        {
            // Use PrimaryRole instead of fetching all roles
            var role = user.PrimaryRole ?? "Student"; // Default to "Student" if PrimaryRole is not set

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Role, role) // Add only PrimaryRole
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"] ?? throw new InvalidOperationException("JWT Key not found in configuration")));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddDays(int.Parse(_configuration["JwtSettings:ExpiryInDays"] ?? "7")); // Token expiry from configuration

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"] ?? throw new InvalidOperationException("JWT Key not found in configuration"));

            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["JwtSettings:Audience"],
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }

    public static class TokenServiceExtensions
    {
        public static string? GetUserIdFromToken(this ClaimsPrincipal? principal)
        {
            return principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        public static string? GetUsernameFromToken(this ClaimsPrincipal? principal)
        {
            return principal?.FindFirst(ClaimTypes.Name)?.Value;
        }

        public static string? GetEmailFromToken(this ClaimsPrincipal? principal)
        {
            return principal?.FindFirst(ClaimTypes.Email)?.Value;
        }

        public static string? GetRoleFromToken(this ClaimsPrincipal? principal)
        {
            return principal?.FindFirst(ClaimTypes.Role)?.Value;
        }

        public static bool IsInRole(this ClaimsPrincipal? principal, string role)
        {
            return principal?.HasClaim(c => c.Type == ClaimTypes.Role && c.Value == role) ?? false;
        }
    }
}
