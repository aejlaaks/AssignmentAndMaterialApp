using TehtavaApp.API.Models;

namespace TehtavaApp.API.Services.Interfaces;

/// <summary>
/// Abstraction for handling material-related notifications.
/// Follows the Single Responsibility Principle by focusing only on material notification logic.
/// Follows the Dependency Inversion Principle by depending on abstractions.
/// Decouples notification concerns from material CRUD operations.
/// </summary>
public interface IMaterialNotificationService
{
    /// <summary>
    /// Sends notifications when a new material is created
    /// </summary>
    /// <param name="material">The created material</param>
    Task NotifyMaterialCreatedAsync(Material material);

    /// <summary>
    /// Sends notifications when a material is updated
    /// </summary>
    /// <param name="material">The updated material</param>
    Task NotifyMaterialUpdatedAsync(Material material);

    /// <summary>
    /// Sends notifications when a material is deleted
    /// </summary>
    /// <param name="materialId">The ID of the deleted material</param>
    /// <param name="materialTitle">The title of the deleted material</param>
    /// <param name="courseId">The course ID (optional)</param>
    Task NotifyMaterialDeletedAsync(int materialId, string materialTitle, int? courseId = null);

    /// <summary>
    /// Sends notifications when materials are bulk uploaded
    /// </summary>
    /// <param name="materials">The list of uploaded materials</param>
    /// <param name="courseId">The course ID</param>
    Task NotifyBulkMaterialsUploadedAsync(IEnumerable<Material> materials, int courseId);
}

