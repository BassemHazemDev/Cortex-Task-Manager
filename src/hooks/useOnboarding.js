/**
 * @module useOnboarding
 * 
 * Custom hook for managing onboarding tour state.
 * Persists completion status in IndexedDB.
 */

import { useState, useEffect, useCallback } from 'react';
import { loadAppSetting, saveAppSetting } from '../utils/storage';

const ONBOARDING_KEY = 'onboardingCompleted';

/**
 * Hook to manage onboarding tour state
 * @returns {Object} Onboarding state and controls
 */
export function useOnboarding() {
    // Default to true to prevent flash of tour on returning users
    const [hasCompletedTour, setHasCompletedTour] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [runTour, setRunTour] = useState(false);

    // Load tour completion status on mount
    useEffect(() => {
        const checkTourStatus = async () => {
            try {
                const completed = await loadAppSetting(ONBOARDING_KEY, false);
                setHasCompletedTour(completed);
                // Auto-start tour for new users
                if (!completed) {
                    setRunTour(true);
                }
            } catch (error) {
                console.error('Error loading onboarding status:', error);
                // On error, assume completed to avoid annoying returning users
                setHasCompletedTour(true);
            } finally {
                setIsLoading(false);
            }
        };
        checkTourStatus();
    }, []);

    /**
     * Mark tour as completed
     */
    const completeTour = useCallback(async () => {
        try {
            await saveAppSetting(ONBOARDING_KEY, true);
            setHasCompletedTour(true);
            setRunTour(false);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    }, []);

    /**
     * Reset tour to show again (for settings or help)
     */
    const resetTour = useCallback(async () => {
        try {
            await saveAppSetting(ONBOARDING_KEY, false);
            setHasCompletedTour(false);
            setRunTour(true);
        } catch (error) {
            console.error('Error resetting onboarding status:', error);
        }
    }, []);

    /**
     * Start tour manually
     */
    const startTour = useCallback(() => {
        setRunTour(true);
    }, []);

    /**
     * Stop tour without completing
     */
    const stopTour = useCallback(() => {
        setRunTour(false);
    }, []);

    return {
        hasCompletedTour,
        isLoading,
        runTour,
        completeTour,
        resetTour,
        startTour,
        stopTour,
    };
}

export default useOnboarding;
