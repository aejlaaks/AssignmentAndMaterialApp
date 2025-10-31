/**
 * Formats a date string or Date object to a localized format
 * @param date - ISO date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('fi-FI', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toString();
  }
};

/**
 * Formats a date string or Date object to a short date format (without time)
 * @param date - ISO date string or Date object
 * @returns Formatted date string
 */
export const formatShortDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toString();
  }
};

/**
 * Formats a date string to a time format (without date)
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return dateString;
  }
};

/**
 * Formats a date string to a relative format (e.g. "2 days ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffMonth / 12);

    if (diffSec < 60) {
      return 'Juuri nyt';
    } else if (diffMin < 60) {
      return `${diffMin} minuuttia sitten`;
    } else if (diffHour < 24) {
      return `${diffHour} tuntia sitten`;
    } else if (diffDay < 30) {
      return `${diffDay} päivää sitten`;
    } else if (diffMonth < 12) {
      return `${diffMonth} kuukautta sitten`;
    } else {
      return `${diffYear} vuotta sitten`;
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return dateString;
  }
};

/**
 * Checks if a date is in the past
 * @param dateString - ISO date string
 * @returns True if the date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  } catch (error) {
    console.error('Error checking if date is in the past:', error);
    return false;
  }
};

/**
 * Checks if a date is in the future
 * @param dateString - ISO date string
 * @returns True if the date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  } catch (error) {
    console.error('Error checking if date is in the future:', error);
    return false;
  }
};

/**
 * Calculates the difference in days between two dates
 * @param dateString1 - First ISO date string
 * @param dateString2 - Second ISO date string (defaults to current date)
 * @returns Difference in days
 */
export const getDaysDifference = (dateString1: string, dateString2?: string): number => {
  try {
    const date1 = new Date(dateString1);
    const date2 = dateString2 ? new Date(dateString2) : new Date();
    const diffMs = date2.getTime() - date1.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
}; 