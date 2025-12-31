/**
 * @module OnboardingTour
 * 
 * Guided tour component for first-time users.
 * Uses react-joyride to walk users through key features.
 * Styled to match the app's OKLCH color system.
 */

import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useOnboarding } from '../hooks/useOnboarding';
import { useApp } from '../contexts/AppContext';

/**
 * Tour steps configuration
 * Each step targets a specific UI element with a CSS selector
 */
const tourSteps = [
  {
    target: '.header-logo',
    content: 'Welcome to Cortex Task Manager! 🎉 Let me give you a quick tour of the key features.',
    placement: 'bottom',
    disableBeacon: true,
    title: 'Welcome!',
  },
  {
    target: '[data-tour="add-task"]',
    content: 'Click here to create a new task. You can set due dates, priorities, tags, and even recurring schedules.',
    placement: 'left',
    title: 'Create Tasks',
  },
  {
    target: '.calendar-button',
    content: 'View all your tasks on an interactive calendar. You can drag and drop tasks to reschedule them!',
    placement: 'bottom',
    title: 'Calendar View',
  },
  {
    target: '[data-tour="tasks-tab"]',
    content: 'See your tasks in a list view with powerful filtering, sorting, and search capabilities.',
    placement: 'bottom',
    title: 'Tasks View',
  },
  {
    target: '[data-tour="scheduler-tab"]',
    content: 'Let our Smart Scheduler automatically organize your day based on priorities and available time.',
    placement: 'bottom',
    title: 'Smart Scheduler ✨',
  },
  {
    target: '[data-tour="quick-todos"]',
    content: 'Add quick TODOs for simple tasks that don\'t need a specific date. Perfect for your daily checklist!',
    placement: 'left',
    title: 'Quick TODOs',
  },
  {
    target: '[data-tour="shortcuts-btn"]',
    content: 'Use keyboard shortcuts to work faster! Press ? anytime to see all available shortcuts.',
    placement: 'bottom',
    title: 'Keyboard Shortcuts',
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: 'Toggle between light and dark mode. Your preference is saved automatically.',
    placement: 'bottom',
    title: 'Theme Toggle',
  },
];

/**
 * Custom styles matching the app's design system
 */
const getStyles = (isDarkMode) => ({
  options: {
    arrowColor: isDarkMode ? 'oklch(0.18 0.02 240)' : 'oklch(0.98 0.01 120)',
    backgroundColor: isDarkMode ? 'oklch(0.18 0.02 240)' : 'oklch(0.98 0.01 120)',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    primaryColor: isDarkMode ? 'oklch(0.7 0.1 220)' : 'oklch(0.45 0.08 220)',
    textColor: isDarkMode ? 'oklch(0.98 0.01 120)' : 'oklch(0.15 0.02 240)',
    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
    width: 380,
    zIndex: 1000,
  },
  tooltip: {
    borderRadius: '0.75rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: '1.25rem',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  tooltipContent: {
    fontSize: '0.95rem',
    lineHeight: 1.5,
  },
  buttonNext: {
    backgroundColor: isDarkMode ? 'oklch(0.7 0.1 220)' : 'oklch(0.45 0.08 220)',
    borderRadius: '0.5rem',
    color: isDarkMode ? 'oklch(0.13 0.02 240)' : 'oklch(0.98 0.01 120)',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
    fontWeight: 500,
  },
  buttonBack: {
    color: isDarkMode ? 'oklch(0.7 0.02 240)' : 'oklch(0.55 0.02 240)',
    fontSize: '0.9rem',
    marginRight: '0.5rem',
  },
  buttonSkip: {
    color: isDarkMode ? 'oklch(0.6 0.02 240)' : 'oklch(0.5 0.02 240)',
    fontSize: '0.85rem',
  },
  buttonClose: {
    color: isDarkMode ? 'oklch(0.7 0.02 240)' : 'oklch(0.55 0.02 240)',
  },
  spotlight: {
    borderRadius: '0.75rem',
  },
  beacon: {
    display: 'none', // We disable beacons for cleaner UX
  },
});

/**
 * OnboardingTour component
 * Renders the guided tour for new users
 */
export function OnboardingTour() {
  const { hasCompletedTour, isLoading, runTour, completeTour, stopTour } = useOnboarding();
  const { isDarkMode } = useApp();

  /**
   * Handle tour events
   */
  const handleCallback = (data) => {
    const { status, action, type } = data;

    // Tour completed or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      completeTour();
    }

    // User closed the tour
    if (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) {
      stopTour();
    }
  };

  // Don't render while loading or if tour is not running
  if (isLoading || !runTour) {
    return null;
  }

  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      scrollToFirstStep
      spotlightClicks={false}
      disableOverlayClose
      callback={handleCallback}
      styles={getStyles(isDarkMode)}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it!',
        next: 'Next',
        open: 'Open the dialog',
        skip: 'Skip tour',
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))',
          },
        },
      }}
    />
  );
}

export default OnboardingTour;
