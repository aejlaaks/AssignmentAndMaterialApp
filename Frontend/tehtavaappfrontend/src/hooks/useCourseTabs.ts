import { useState, useCallback } from 'react';

/**
 * Custom hook to manage tabs in the course detail page
 * 
 * @returns Tab-related state and handlers
 */
export const useCourseTabs = () => {
  const [tabValue, setTabValue] = useState(0);

  /**
   * Handle tab change event
   */
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  return {
    tabValue,
    setTabValue,
    handleTabChange
  };
}; 