import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that provides the current date and automatically updates when the day changes.
 * This ensures that date-dependent components and logic refresh immediately at midnight.
 */
export function useDateRefresh() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Force immediate refresh on mount to ensure we have the correct date
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

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
    let intervalId;

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
    
    // Also set up a periodic check every 30 seconds to ensure we have the current date
    // This helps catch cases where the timeout might not fire correctly
    intervalId = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    }, 30000); // Check every 30 seconds

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [msUntilMidnight, currentDate]);

  // Helper functions that use the current date
  const getToday = useCallback(() => {
    // Use local date to avoid timezone issues
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [currentDate]);

  const getTomorrow = useCallback(() => {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [currentDate]);

  const getDayAfterTomorrow = useCallback(() => {
    const dayAfter = new Date(currentDate);
    dayAfter.setDate(currentDate.getDate() + 2);
    const year = dayAfter.getFullYear();
    const month = String(dayAfter.getMonth() + 1).padStart(2, '0');
    const day = String(dayAfter.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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