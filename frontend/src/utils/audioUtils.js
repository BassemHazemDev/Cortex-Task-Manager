/**
 * @module audioUtils
 * 
 * Centralized audio utilities for the application.
 * Previously duplicated across App.jsx, CalendarView.jsx, and TaskList.jsx.
 */

/**
 * Plays the task completion sound effect.
 * This provides audio feedback when a user completes a task or TODO.
 */
export function playCompleteSound() {
  try {
    const audio = new window.Audio('/complete.mp3');
    audio.play().catch((error) => {
      // Silently fail if audio can't play (e.g., user hasn't interacted with page yet)
      console.debug('Audio playback prevented:', error.message);
    });
  } catch (error) {
    console.debug('Audio not available:', error.message);
  }
}
