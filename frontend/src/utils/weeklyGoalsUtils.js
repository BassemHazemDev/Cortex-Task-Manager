/**
 * Utility functions for Weekly Goals & Missions.
 * The week runs from Saturday to Friday.
 */

import { pad } from './dateUtils';

/**
 * Returns the Saturday at 00:00:00 that begins the week for the given date.
 * JavaScript getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
 * Sat (6) -> 0 days back
 * Sun (0) -> 1 day back
 * Mon (1) -> 2 days back
 * ...
 * Fri (5) -> 6 days back
 */
export function getSaturdayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - diffToSaturday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the Friday at 23:59:59 that ends the week for the given date.
 */
export function getFridayOfWeek(date) {
  const sat = getSaturdayOfWeek(date);
  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);
  fri.setHours(23, 59, 59, 999);
  return fri;
}

/**
 * Formats a Date object as 'YYYY-MM-DD'.
 */
export function formatDateKey(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Returns the week key ('YYYY-MM-DD' of the Saturday start) for a given date.
 */
export function getWeekKey(date = new Date()) {
  return formatDateKey(getSaturdayOfWeek(date));
}

/**
 * Returns the next week's Saturday key.
 */
export function getNextWeekKey(weekKey) {
  const sat = new Date(weekKey + 'T00:00:00');
  sat.setDate(sat.getDate() + 7);
  return formatDateKey(sat);
}

/**
 * Returns the previous week's Saturday key.
 */
export function getPrevWeekKey(weekKey) {
  const sat = new Date(weekKey + 'T00:00:00');
  sat.setDate(sat.getDate() - 7);
  return formatDateKey(sat);
}

/**
 * Formats the Saturday-to-Friday week range for display.
 * Example: "Sat, Sep 26 - Fri, Oct 02, 2026"
 */
export function formatWeekRangeDisplay(weekKey) {
  if (!weekKey) return '';
  const sat = new Date(weekKey + 'T00:00:00');
  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);

  const satOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const friOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };

  return `${sat.toLocaleDateString('en-US', satOptions)} – ${fri.toLocaleDateString('en-US', friOptions)}`;
}

/**
 * Checks if today is Saturday.
 */
export function isTodaySaturday(now = new Date()) {
  return now.getDay() === 6;
}

/**
 * Checks if today is Friday.
 */
export function isTodayFriday(now = new Date()) {
  return now.getDay() === 5;
}

/**
 * Curated color themes for weekly missions with rich light & dark accents.
 */
export const GOAL_COLORS = [
  {
    id: 'indigo',
    name: 'Royal Indigo',
    primary: '#6366f1',
    gradient: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    dot: 'bg-indigo-500',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#10b981',
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  {
    id: 'violet',
    name: 'Neon Violet',
    primary: '#8b5cf6',
    gradient: 'from-violet-500/20 via-violet-500/10 to-transparent',
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/15 dark:bg-violet-500/25',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
    dot: 'bg-violet-500',
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    primary: '#f59e0b',
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  {
    id: 'rose',
    name: 'Coral Rose',
    primary: '#f43f5e',
    gradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/15 dark:bg-rose-500/25',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    primary: '#06b6d4',
    gradient: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
];

export function getGoalColor(colorId) {
  return GOAL_COLORS.find(c => c.id === colorId) || GOAL_COLORS[0];
}

/**
 * Generates partitioned cards for a weekly mission.
 * @param {Object} params
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {number} params.totalHours
 * @param {'hours' | 'parts'} params.partitionType
 * @param {number} params.partitionValue - either hours per card (e.g. 1.0) or count of parts (e.g. 3)
 * @param {string} params.goalId
 * @returns {Array<Object>} Generated cards
 */
export function generatePartitionCards({
  title,
  description = '',
  totalHours = 1,
  partitionType = 'hours',
  partitionValue = 1,
  goalId,
}) {
  const cards = [];
  const hoursNum = Math.max(0.5, Number(totalHours) || 1);
  const partValNum = Math.max(0.5, Number(partitionValue) || 1);

  if (partitionType === 'hours') {
    // Partition by hours per card (e.g., 3 hours total, 1 hour per card => 3 cards)
    const cardHours = partValNum;
    const cardCount = Math.max(1, Math.ceil(hoursNum / cardHours));
    let remainingHours = hoursNum;

    for (let i = 0; i < cardCount; i++) {
      const currentCardHours = Math.min(cardHours, parseFloat(remainingHours.toFixed(2)));
      remainingHours -= currentCardHours;
      cards.push({
        id: `card_${goalId}_${i + 1}`,
        goalId,
        partIndex: i + 1,
        totalParts: cardCount,
        hours: currentCardHours,
        title: `${title} (Card ${i + 1}/${cardCount})`,
        description,
        assignedDate: null,
        isCompleted: false,
        completedAt: null,
      });
    }
  } else {
    // Partition by number of split parts (e.g., 3 parts)
    const cardCount = Math.max(1, Math.round(partValNum));
    const cardHours = parseFloat((hoursNum / cardCount).toFixed(1));

    for (let i = 0; i < cardCount; i++) {
      cards.push({
        id: `card_${goalId}_${i + 1}`,
        goalId,
        partIndex: i + 1,
        totalParts: cardCount,
        hours: cardHours,
        title: `${title} (Part ${i + 1}/${cardCount})`,
        description,
        assignedDate: null,
        isCompleted: false,
        completedAt: null,
      });
    }
  }

  return cards;
}
