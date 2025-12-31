/**
 * @module haptics
 * 
 * Provides haptic feedback on supported mobile devices.
 * Uses the Vibration API with graceful degradation for unsupported devices.
 */

/**
 * Check if the device supports vibration
 * @returns {boolean}
 */
const supportsVibration = () => 'vibrate' in navigator;

/**
 * Haptic feedback utilities for touch interactions
 */
export const haptics = {
    /**
     * Light feedback for selection/tap (10ms)
     */
    light: () => {
        if (supportsVibration()) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium feedback for actions (20ms)
     */
    medium: () => {
        if (supportsVibration()) {
            navigator.vibrate(20);
        }
    },

    /**
     * Success feedback - double tap pattern
     */
    success: () => {
        if (supportsVibration()) {
            navigator.vibrate([10, 50, 10]);
        }
    },

    /**
     * Error/warning feedback - stronger pattern
     */
    error: () => {
        if (supportsVibration()) {
            navigator.vibrate([30, 50, 30]);
        }
    },

    /**
     * Drag start feedback
     */
    dragStart: () => {
        if (supportsVibration()) {
            navigator.vibrate(15);
        }
    },

    /**
     * Drag end/drop feedback
     */
    dragEnd: () => {
        if (supportsVibration()) {
            navigator.vibrate([10, 30, 10]);
        }
    },
};

export default haptics;
