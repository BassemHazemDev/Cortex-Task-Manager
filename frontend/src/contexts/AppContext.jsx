/**
 * @module AppContext
 * 
 * Provides application-wide state and settings including:
 * - Theme management (dark/light mode)
 * - Notifications system
 * - Available hours settings
 * - Calendar expansion state
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadAppSetting, saveAppSetting } from '../utils/storage';

const AppContext = createContext(null);

/**
 * Custom hook to access the App context.
 * @returns {Object} App context value
 * @throws {Error} If used outside of AppProvider
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/**
 * AppProvider component that wraps the application and provides global state.
 */
export function AppProvider({ children }) {
  // Theme state - default to system preference initially
  // We will load user preference from DB asynchronously
  // Theme state - default to false (light mode) initially
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Calendar expansion state (desktop only)
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  
  // Mobile calendar expansion state (full-screen modal)
  const [mobileCalendarExpanded, setMobileCalendarExpanded] = useState(false);

  // Available hours state
  const [availableHours, setAvailableHours] = useState({ start: '13:00', end: '22:00' });

  // Load settings (theme + hours) from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load available hours
        const savedHours = await loadAppSetting('availableHours', { start: '13:00', end: '22:00' });
        if (savedHours?.start && savedHours?.end) {
          setAvailableHours(savedHours);
        }

        // Load theme
        const savedTheme = await loadAppSetting('theme', null);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save available hours when they change
  useEffect(() => {
    if (availableHours?.start && availableHours?.end) {
      saveAppSetting('availableHours', availableHours);
    }
  }, [availableHours]);

  // Apply dark mode class to document and save preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      saveAppSetting('theme', 'dark').catch(e => console.error(e));
    } else {
      root.classList.remove('dark');
      saveAppSetting('theme', 'light').catch(e => console.error(e));
    }
  }, [isDarkMode]);

  /**
   * Toggles between dark and light mode.
   */
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  /**
   * Displays a notification to the user.
   * Notifications auto-dismiss after 5 seconds.
   * @param {Object} notification - The notification object
   * @param {string} notification.type - Type: 'success' | 'error' | 'warning' | 'info'
   * @param {string} notification.message - Main message
   * @param {string} [notification.details] - Optional details
   */
  const showNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  }, []);

  /**
   * Removes a notification from the screen.
   * @param {number} id - The notification ID to dismiss
   */
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    // Theme
    isDarkMode,
    toggleDarkMode,
    
    // Notifications
    notifications,
    showNotification,
    dismissNotification,
    
    // Settings
    showSettingsModal,
    setShowSettingsModal,
    availableHours,
    setAvailableHours,
    
    // Calendar
    calendarExpanded,
    setCalendarExpanded,
    mobileCalendarExpanded,
    setMobileCalendarExpanded,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;
