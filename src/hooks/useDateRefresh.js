import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that provides the current date and automatically updates when the day changes.
 * This ensures that date-dependent components and logic refresh immediately at midnight.
 */
export function useDateRefresh() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Calculates milliseconds until next midnight
  const msUntilMidnight = useCallback(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    return midnight.getTime() - now.getTime();
  }, []);

  // Forces a date refresh - useful for testing or manual triggers
  const refreshDate = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    let timeoutId;

    const scheduleNextRefresh = () => {
      const msToWait = msUntilMidnight();
      
      timeoutId = setTimeout(() => {
        // Update the date immediately at midnight
        setCurrentDate(new Date());
        
        // Schedule the next refresh for the following midnight
        scheduleNextRefresh();
      }, msToWait);
    };

    // Start the initial timeout
    scheduleNextRefresh();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [msUntilMidnight]);

  // Helper functions that use the current date
  const getToday = useCallback(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  const getTomorrow = useCallback(() => {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, [currentDate]);

  const getDayAfterTomorrow = useCallback(() => {
    const dayAfter = new Date(currentDate);
    dayAfter.setDate(currentDate.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  }, [currentDate]);

  const isToday = useCallback((dateStr) => {
    return dateStr === getToday();
  }, [getToday]);

  const isTomorrow = useCallback((dateStr) => {
    return dateStr === getTomorrow();
  }, [getTomorrow]);

  return {
    currentDate,
    refreshDate,
    getToday,
    getTomorrow,
    getDayAfterTomorrow,
    isToday,
    isTomorrow,
    // Also provide the raw date for backward compatibility
    now: currentDate
  };
}