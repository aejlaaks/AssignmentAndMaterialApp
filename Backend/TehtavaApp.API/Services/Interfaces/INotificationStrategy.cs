using TehtavaApp.API.Models;
using TehtavaApp.API.Services.Interfaces;

namespace TehtavaApp.API.Services.Strategies
{
    /// <summary>
    /// Interface for notification strategy pattern
    /// </summary>
    public interface INotificationStrategy
    {
        /// <summary>
        /// Creates a notification based on the provided context
        /// </summary>
        /// <param name="notificationService">The notification service to use</param>
        /// <param name="context">The context object containing data for the notification</param>
        /// <returns>The created notification</returns>
        Task<Notification> CreateNotificationAsync(
            INotificationService notificationService, 
            object context);
    }
} 