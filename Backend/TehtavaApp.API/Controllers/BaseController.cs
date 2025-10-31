using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using System;

namespace TehtavaApp.API.Controllers
{
    public abstract class BaseController : ControllerBase
    {
        protected BaseController()
        {
        }

        protected string UserId
        {
            get
            {
                if (User?.Identity?.IsAuthenticated != true)
                {
                    return null;
                }
                return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
        }
        protected string UserEmail => User.FindFirst(ClaimTypes.Email)?.Value;
        protected string UserName => User.FindFirst(ClaimTypes.Name)?.Value;

        protected bool IsAdmin => User.IsInRole("Admin");
        protected bool IsTeacher => User.IsInRole("Teacher") || IsAdmin;
        protected bool IsStudent => User.IsInRole("Student");

        protected ActionResult HandleError(Exception ex)
        {
            // Log the error here if needed
            return ex switch
            {
                ArgumentException ae => BadRequest(ae.Message),
                UnauthorizedAccessException => new ForbidResult(),
                KeyNotFoundException ks => NotFound(ks.Message),
                _ => StatusCode(500, "An unexpected error occurred")
            };
        }

        protected ActionResult<T> HandleError<T>(Exception ex) where T : class
        {
            // Log the error here if needed
            ActionResult result = ex switch
            {
                ArgumentException ae => BadRequest(ae.Message),
                UnauthorizedAccessException => new ForbidResult(),
                KeyNotFoundException ks => NotFound(ks.Message),
                _ => StatusCode(500, "An unexpected error occurred")
            };
            return result as ActionResult<T>;
        }

        protected ActionResult<IEnumerable<T>> HandleErrorForList<T>(Exception ex) where T : class
        {
            // Log the error here if needed
            ActionResult result = ex switch
            {
                ArgumentException ae => BadRequest(ae.Message),
                UnauthorizedAccessException => new ForbidResult(),
                KeyNotFoundException ks => NotFound(ks.Message),
                _ => StatusCode(500, "An unexpected error occurred")
            };
            return result as ActionResult<IEnumerable<T>>;
        }

        protected ActionResult<T> HandleResult<T>(T result) where T : class
        {
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        protected ActionResult<IEnumerable<T>> HandleListResult<T>(IEnumerable<T> result) where T : class
        {
            if (result == null)
                return NotFound();

            var list = result.ToList();
            return list.Any() ? Ok(list) : Ok(Enumerable.Empty<T>());
        }

        protected ActionResult<T> HandleCreated<T>(T entity, string actionName, object routeValues = null) where T : class
        {
            if (entity == null)
                return BadRequest();

            return CreatedAtAction(actionName, routeValues, entity);
        }

        protected ActionResult HandleNoContent(bool result)
        {
            return result ? NoContent() : NotFound();
        }

        protected ActionResult<T> HandleForbidden<T>() where T : class
        {
            return new ObjectResult(null)
            {
                StatusCode = StatusCodes.Status403Forbidden
            } as ActionResult<T>;
        }

        protected ActionResult<T> HandleNotFound<T>() where T : class
        {
            return NotFound();
        }

        protected ActionResult<T> HandleBadRequest<T>(string message = null) where T : class
        {
            return BadRequest(message ?? "Invalid request");
        }

        protected ActionResult<T> HandleUnauthorized<T>(string message = null) where T : class
        {
            return new ObjectResult(new { message = message ?? "Unauthorized" })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            } as ActionResult<T>;
        }

        protected ActionResult<T> HandleServerError<T>(string message = null) where T : class
        {
            return StatusCode(500, message ?? "An unexpected error occurred");
        }

        protected ActionResult<T> HandleValidationError<T>(string message) where T : class
        {
            return BadRequest(message);
        }

        protected ActionResult<T> HandleConflict<T>(string message = null) where T : class
        {
            return Conflict(message ?? "A conflict occurred");
        }

        protected ActionResult<T> HandleOk<T>(T value) where T : class
        {
            return Ok(value);
        }
    }
}
