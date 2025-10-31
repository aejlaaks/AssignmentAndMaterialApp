/**
 * Simple stub version of reportWebVitals
 * This is a placeholder implementation that doesn't rely on web-vitals
 */
const reportWebVitals = (onPerfEntry?: (metric: any) => void): void => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    console.log('Web vitals reporting disabled');
  }
};

export default reportWebVitals; 