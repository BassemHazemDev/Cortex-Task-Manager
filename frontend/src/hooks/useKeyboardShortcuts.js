/**
 * @module useKeyboardShortcuts
 * 
 * Custom hook for handling global keyboard shortcuts.
 * Provides shortcuts for common actions like opening forms and switching views.
 * 
 * Shortcuts are disabled when typing in input fields, textareas, or selects.
 */

import { useEffect, useCallback } from 'react';

/**
 * Hook to register global keyboard shortcuts.
 * 
 * @param {Object} shortcuts - Object mapping shortcut keys to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+n': () => openNewTaskForm(),
 *   'escape': () => closeModal(),
 *   'ctrl+d': () => toggleDarkMode(),
 * });
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
    const handleKeyDown = useCallback((event) => {
        if (!enabled) return;

        // Skip if user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.isContentEditable
        );

        // Allow Escape and Ctrl+Enter to work even when typing
        if (isTyping) {
            if (event.key === 'Escape') {
                // Pass through
            } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                // Pass through
            } else {
                return;
            }
        }

        // Build the key combination string
        const keyParts = [];
        if (event.ctrlKey || event.metaKey) keyParts.push('ctrl');
        if (event.altKey) keyParts.push('alt');
        if (event.shiftKey) keyParts.push('shift');

        // Normalize key name
        let keyName = event.key.toLowerCase();
        if (keyName === ' ') keyName = 'space';
        keyParts.push(keyName);

        const keyCombo = keyParts.join('+');

        // Check if we have a handler for this shortcut
        const handler = shortcuts[keyCombo] || shortcuts[event.key.toLowerCase()];

        if (handler) {
            event.preventDefault();
            event.stopPropagation();
            handler(event);
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Default shortcuts configuration for the Task Manager app.
 * 
 * @param {Object} actions - Object containing action functions
 * @returns {Object} Shortcuts configuration
 */
export function getDefaultShortcuts(actions) {
    return {
        // Form shortcuts
        'ctrl+n': actions.openNewTask,
        'ctrl+t': actions.openNewTodo,

        // Modal shortcuts
        'escape': actions.closeModal,

        // View shortcuts
        'ctrl+1': actions.showCalendarView,
        'ctrl+2': actions.showTasksView,
        'ctrl+3': actions.showSchedulerView,

        // Theme shortcuts
        'ctrl+d': actions.toggleDarkMode,
    };
}

export default useKeyboardShortcuts;
