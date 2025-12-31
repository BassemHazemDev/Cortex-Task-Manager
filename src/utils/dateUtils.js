/**
 * @module dateUtils
 * 
 * Centralized date/time utilities for the application.
 * Previously duplicated across CalendarView.jsx, TaskList.jsx, and SmartScheduler.jsx.
 */

/**
 * Checks if a task is overdue based on its due date, time, and duration.
 * A task is overdue if:
 * - It's not completed AND
 * - For tasks with duration: current time is past (dueDate + dueTime + duration)
 * - For tasks without duration: current time is past dueTime (or end of day if no time)
 * 
 * @param {Object} task - The task object to check
 * @param {Date} [now=new Date()] - The current date/time for comparison
 * @returns {boolean} True if the task is overdue
 */
export function isOverdue(task, now = new Date()) {
    if (task.isCompleted || !task.dueDate) return false;

    if (!task.dueTime) {
        // No dueTime: overdue if the day is over
        const dayEnd = new Date(task.dueDate + 'T23:59:59');
        return now > dayEnd;
    }

    const start = new Date(task.dueDate + 'T' + task.dueTime);

    if (!task.estimatedDuration || isNaN(task.estimatedDuration) || task.estimatedDuration <= 0) {
        // No duration: overdue as soon as due time is met
        return now > start;
    }

    // Has duration: overdue after duration ends
    const end = new Date(start.getTime() + task.estimatedDuration * 60000);
    return now > end;
}

/**
 * Converts a time string (HH:mm) to 12-hour format with AM/PM.
 * 
 * @param {string} timeStr - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export function formatTime12(timeStr) {
    if (!timeStr) return '';

    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Pads a number with leading zeros.
 * 
 * @param {number} n - The number to pad
 * @param {number} [width=2] - The target width
 * @returns {string} Padded number string
 */
export function pad(n, width = 2) {
    return n.toString().padStart(width, '0');
}

/**
 * Formats a Date object to YYYY-MM-DD string for consistent date handling.
 * 
 * @param {Date} date - The date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export function formatDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Formats a time string to HH:mm format.
 * 
 * @param {Date} date - The date to extract time from
 * @returns {string} Time in HH:mm format
 */
export function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Gets today's date in YYYY-MM-DD format.
 * 
 * @returns {string} Today's date
 */
export function getToday() {
    return formatDate(new Date());
}

/**
 * Checks if a date string represents today.
 * 
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is today
 */
export function isToday(dateStr) {
    return dateStr === getToday();
}

/**
 * Checks if a date string represents tomorrow.
 * 
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {boolean} True if the date is tomorrow
 */
export function isTomorrow(dateStr) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === formatDate(tomorrow);
}
