import { useCallback, useRef } from 'react';

/**
 * Custom hook for handling long press interactions on touch devices.
 * Triggers a callback after a specified duration of continuous touch.
 * 
 * @param {Function} onLongPress - Callback to execute on long press
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Duration in ms before triggering (default: 500)
 * @param {Function} options.onPress - Optional callback for regular press/click
 * @returns {Object} Event handlers to attach to the target element
 */
export function useLongPress(onLongPress, options = {}) {
    const { delay = 500, onPress } = options;

    const timeoutRef = useRef(null);
    const targetRef = useRef(null);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });

    const start = useCallback((event) => {
        // Store starting position to detect movement
        const touch = event.touches?.[0] || event;
        startPosRef.current = { x: touch.clientX, y: touch.clientY };

        // Store target for later reference
        targetRef.current = event.target;
        isLongPressRef.current = false;

        timeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            onLongPress(event);
        }, delay);
    }, [onLongPress, delay]);

    const move = useCallback((event) => {
        // Cancel if user moves finger too far (threshold: 10px)
        if (timeoutRef.current) {
            const touch = event.touches?.[0] || event;
            const dx = Math.abs(touch.clientX - startPosRef.current.x);
            const dy = Math.abs(touch.clientY - startPosRef.current.y);

            if (dx > 10 || dy > 10) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
    }, []);

    const end = useCallback((event) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // If it wasn't a long press and we have an onPress callback, call it
        if (!isLongPressRef.current && onPress) {
            onPress(event);
        }

        // Prevent click event if it was a long press
        if (isLongPressRef.current) {
            event.preventDefault();
        }
    }, [onPress]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        isLongPressRef.current = false;
    }, []);

    return {
        onTouchStart: start,
        onTouchMove: move,
        onTouchEnd: end,
        onTouchCancel: cancel,
        // Also support mouse for testing in desktop browsers
        onMouseDown: start,
        onMouseUp: end,
        onMouseLeave: cancel,
    };
}

export default useLongPress;
