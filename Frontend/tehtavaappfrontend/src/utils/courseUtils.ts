import { Course } from '../types';

/**
 * Safely formats a date from a course object
 * @param course The course object
 * @param dateField The date field to format ('startDate' or 'endDate')
 * @param defaultText Text to display if the date is not available
 * @returns Formatted date string or default text
 */
export const formatCourseDate = (
  course: Course | null | undefined, 
  dateField: 'startDate' | 'endDate',
  defaultText: string = 'Ei määritetty'
): string => {
  if (!course || !course[dateField]) {
    return defaultText;
  }
  
  try {
    return new Date(course[dateField] as string).toLocaleDateString();
  } catch (error) {
    console.error(`Error formatting ${dateField}:`, error);
    return defaultText;
  }
};

/**
 * Checks if a course has a specific date field
 * @param course The course object
 * @param dateField The date field to check ('startDate' or 'endDate')
 * @returns True if the course has the date field
 */
export const hasCourseDate = (
  course: Course | null | undefined, 
  dateField: 'startDate' | 'endDate'
): boolean => {
  return Boolean(course && course[dateField]);
}; 