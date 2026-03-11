import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loadAppSetting, saveAppSetting } from '../utils/storage';
import { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetMeQuery, getStoredUser, isAuthenticated } from '../hooks/queries/authQueries';

const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [mobileCalendarExpanded, setMobileCalendarExpanded] = useState(false);
  const [availableHours, setAvailableHours] = useState({ start: '13:00', end: '22:00' });

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery();

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (!isUserLoading) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        setUser(null);
      }
    }
  }, [userData, isUserLoading]);

  useEffect(() => {
    setAuthLoading(isUserLoading);
  }, [isUserLoading]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedHours = await loadAppSetting('availableHours', { start: '13:00', end: '22:00' });
        if (savedHours?.start && savedHours?.end) {
          setAvailableHours(savedHours);
        }

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

  useEffect(() => {
    if (availableHours?.start && availableHours?.end) {
      saveAppSetting('availableHours', availableHours);
    }
  }, [availableHours]);

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

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const showNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      setUser(result.data.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      return result;
    } catch (error) {
      throw error;
    }
  }, [loginMutation, queryClient]);

  const register = useCallback(async (userData) => {
    try {
      const result = await registerMutation.mutateAsync(userData);
      setUser(result.data.data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      return result;
    } catch (error) {
      throw error;
    }
  }, [registerMutation, queryClient]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
  }, [logoutMutation]);

  const isLoggedIn = useCallback(() => {
    return isAuthenticated() && user !== null;
  }, [user]);

  const value = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
    notifications,
    showNotification,
    dismissNotification,
    showSettingsModal,
    setShowSettingsModal,
    availableHours,
    setAvailableHours,
    calendarExpanded,
    setCalendarExpanded,
    mobileCalendarExpanded,
    setMobileCalendarExpanded,
    user,
    login,
    register,
    logout,
    isLoggedIn,
    isLoading: authLoading,
  }), [
    isDarkMode,
    notifications,
    showSettingsModal,
    availableHours,
    calendarExpanded,
    mobileCalendarExpanded,
    user,
    authLoading,
    toggleDarkMode,
    showNotification,
    dismissNotification,
    login,
    register,
    logout,
    isLoggedIn,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;
