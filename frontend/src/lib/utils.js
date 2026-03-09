/**
 * Formats a date and time string with context (today/tomorrow/weekday) and correct AM/PM.
 * @param {string} dateStr - Date in YYYY-MM-DD
 * @param {string} timeStr - Time in HH:mm
 * @returns {string} - e.g. "today at 9:30 PM", "tomorrow at 1:00 AM", "Monday at 2:00 PM"
 */
export function formatDateTimeContext(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const now = new Date();
  const dateObj = new Date(dateStr + 'T' + timeStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const compareDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  let context = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (compareDate.getTime() === today.getTime()) {
    context = 'today';
  } else if (compareDate.getTime() === tomorrow.getTime()) {
    context = 'tomorrow';
  }

  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${context} at ${time}`;
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
