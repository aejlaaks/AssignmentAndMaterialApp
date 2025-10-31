/**
 * Utility functions for handling submission status
 */

/**
 * Safely normalizes a submission status to a proper string value
 * Handles cases where status might be a number, string, or undefined
 * 
 * @param status The status value from a submission object
 * @returns A normalized string status: 'submitted', 'graded', 'returned', or 'unknown'
 */
export const normalizeStatus = (status: any): 'submitted' | 'graded' | 'returned' | 'unknown' => {
  // If status is undefined or null
  if (status === undefined || status === null) {
    return 'submitted'; // Default value
  }

  // If status is a number, map it to a string
  if (typeof status === 'number') {
    return mapNumericStatus(status);
  }

  // If status is a string, normalize it
  if (typeof status === 'string') {
    const lowerStatus = status.toLowerCase();
    
    if (['submitted', 'graded', 'returned'].includes(lowerStatus)) {
      return lowerStatus as 'submitted' | 'graded' | 'returned';
    }
    
    // Handle numeric strings (e.g., "3")
    if (/^\d+$/.test(status)) {
      return mapNumericStatus(parseInt(status, 10));
    }
  }

  // If we get here, we couldn't determine the status
  console.warn('Unknown submission status format:', status);
  return 'unknown';
};

/**
 * Maps a numeric status to the corresponding string status
 * 
 * @param status The numeric status value
 * @returns A string status
 */
export const mapNumericStatus = (status: number): 'submitted' | 'graded' | 'returned' | 'unknown' => {
  // Backend AssignmentStatus enum:
  // Draft = 0, Published = 1, InProgress = 2, Submitted = 3, Completed = 4, Returned = 5, Archived = 6
  switch (status) {
    case 0: // Draft
      return 'submitted';
    case 1: // Published
    case 2: // InProgress
    case 3: // Submitted
      return 'submitted';
    case 4: // Completed
    case 6: // Archived
      return 'graded';
    case 5: // Returned
      return 'returned';
    default:
      return 'unknown';
  }
};

/**
 * Gets the display text for a status value
 * 
 * @param status The status to get display text for
 * @returns Localized display text for the status
 */
export const getStatusDisplayText = (status: any): string => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case 'submitted':
      return 'Palautettu';
    case 'graded':
      return 'Arvioitu';
    case 'returned':
      return 'Palautettu opiskelijalle';
    default:
      return 'Tuntematon tila';
  }
};

/**
 * Gets the appropriate Material UI color for a submission status
 * 
 * @param status The status to get color for
 * @returns Material UI color name
 */
export const getStatusColor = (status: any): 'primary' | 'success' | 'info' | 'warning' | 'default' => {
  const normalizedStatus = normalizeStatus(status);
  
  switch (normalizedStatus) {
    case 'submitted':
      return 'primary';
    case 'graded':
      return 'success';
    case 'returned':
      return 'info';
    default:
      return 'default';
  }
}; 