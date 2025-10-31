/**
 * Helper functions for accessibility in tab components
 */

/**
 * Returns aria attributes for a tab component
 * @param index - The tab index
 * @returns Object with aria attributes
 */
export function a11yProps(index: number) {
  return {
    id: `course-tab-${index}`,
    'aria-controls': `course-tabpanel-${index}`,
  };
} 