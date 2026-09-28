/**
 * Storage management for Weekly Goals & Missions using Dexie with localStorage fallback.
 */

import db from './db';
import { getNextWeekKey } from './weeklyGoalsUtils';

const LOCAL_STORAGE_KEY_PREFIX = 'cortex_weekly_goals_';

/**
 * Loads all weekly goals for a specific weekKey ('YYYY-MM-DD').
 * @param {string} weekKey
 * @returns {Promise<Array<Object>>}
 */
export async function loadWeeklyGoalsForWeek(weekKey) {
  if (!weekKey) return [];

  try {
    if (db.weeklyGoals) {
      const dbGoals = await db.weeklyGoals.where('weekKey').equals(weekKey).toArray();
      if (dbGoals && dbGoals.length > 0) {
        return dbGoals;
      }
    }
  } catch (err) {
    console.warn('Dexie weeklyGoals load failed, checking fallback:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${weekKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load weekly goals from localStorage fallback:', err);
  }

  return [];
}

/**
 * Saves a weekly goal (creates new or updates existing).
 * @param {Object} goal
 * @returns {Promise<Object>}
 */
export async function saveWeeklyGoal(goal) {
  const goalToSave = {
    ...goal,
    updatedAt: new Date().toISOString(),
  };

  // Sync to Dexie
  try {
    if (db.weeklyGoals) {
      await db.weeklyGoals.put(goalToSave);
    }
  } catch (err) {
    console.warn('Dexie saveWeeklyGoal error:', err);
  }

  // Sync to localStorage
  try {
    const existing = await loadWeeklyGoalsForWeek(goalToSave.weekKey);
    const index = existing.findIndex(g => g.id === goalToSave.id);
    let updated;
    if (index >= 0) {
      updated = [...existing];
      updated[index] = goalToSave;
    } else {
      updated = [...existing, goalToSave];
    }
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${goalToSave.weekKey}`,
      JSON.stringify(updated)
    );
  } catch (err) {
    console.error('LocalStorage saveWeeklyGoal error:', err);
  }

  return goalToSave;
}

/**
 * Deletes a weekly goal by its ID.
 * @param {string} goalId
 * @param {string} weekKey
 * @returns {Promise<void>}
 */
export async function deleteWeeklyGoal(goalId, weekKey) {
  try {
    if (db.weeklyGoals) {
      await db.weeklyGoals.delete(goalId);
    }
  } catch (err) {
    console.warn('Dexie deleteWeeklyGoal error:', err);
  }

  try {
    const existing = await loadWeeklyGoalsForWeek(weekKey);
    const filtered = existing.filter(g => g.id !== goalId);
    localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${weekKey}`,
      JSON.stringify(filtered)
    );
  } catch (err) {
    console.error('LocalStorage deleteWeeklyGoal error:', err);
  }
}

/**
 * Updates a specific card inside a goal.
 * @param {string} cardId
 * @param {Object} cardUpdates
 * @param {string} weekKey
 * @returns {Promise<Object|null>} The updated goal or null
 */
export async function updateCardInGoal(cardId, cardUpdates, weekKey) {
  const goals = await loadWeeklyGoalsForWeek(weekKey);
  let targetGoal = null;

  for (const g of goals) {
    const cardIndex = g.cards?.findIndex(c => c.id === cardId);
    if (cardIndex >= 0) {
      const updatedCards = [...g.cards];
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        ...cardUpdates,
      };

      // Check if all cards in this goal are completed
      const allCompleted = updatedCards.every(c => c.isCompleted);

      targetGoal = {
        ...g,
        cards: updatedCards,
        isCompleted: allCompleted,
      };
      await saveWeeklyGoal(targetGoal);
      break;
    }
  }

  return targetGoal;
}

/**
 * Toggles completion status of a card.
 * @param {string} cardId
 * @param {string} weekKey
 * @returns {Promise<Object|null>}
 */
export async function toggleGoalCardComplete(cardId, weekKey) {
  const goals = await loadWeeklyGoalsForWeek(weekKey);
  for (const g of goals) {
    const card = g.cards?.find(c => c.id === cardId);
    if (card) {
      const nextCompleted = !card.isCompleted;
      return await updateCardInGoal(
        cardId,
        {
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        },
        weekKey
      );
    }
  }
  return null;
}

/**
 * Assigns or unassigns a card to a specific calendar date ('YYYY-MM-DD' or null).
 * @param {string} cardId
 * @param {string|null} assignedDate
 * @param {string} weekKey
 * @returns {Promise<Object|null>}
 */
export async function assignGoalCardDate(cardId, assignedDate, weekKey) {
  return await updateCardInGoal(cardId, { assignedDate }, weekKey);
}

/**
 * Rollovers uncompleted cards from the given week to the next week.
 * Creates corresponding goal(s) in the next week containing only the unfinished cards,
 * with assignedDate reset to null (ready in the new week's available deck).
 * @param {string} fromWeekKey - Saturday key of current week
 * @returns {Promise<{ rolledCount: number, nextWeekKey: string }>}
 */
export async function rolloverUnfinishedGoals(fromWeekKey) {
  const nextWeekKey = getNextWeekKey(fromWeekKey);
  const currentGoals = await loadWeeklyGoalsForWeek(fromWeekKey);
  const nextWeekGoals = await loadWeeklyGoalsForWeek(nextWeekKey);

  let rolledCount = 0;

  for (const goal of currentGoals) {
    const uncompletedCards = (goal.cards || []).filter(c => !c.isCompleted);
    if (uncompletedCards.length === 0) continue;

    rolledCount += uncompletedCards.length;

    // Check if goal with same title already exists in next week
    const existingNextGoal = nextWeekGoals.find(g => g.title === goal.title);

    if (existingNextGoal) {
      // Append uncompleted cards into existing next-week goal
      const newCards = uncompletedCards.map((c, idx) => ({
        ...c,
        id: `card_${existingNextGoal.id}_rolled_${Date.now()}_${idx}`,
        goalId: existingNextGoal.id,
        assignedDate: null,
      }));

      const mergedCards = [...(existingNextGoal.cards || []), ...newCards];
      const updatedGoal = {
        ...existingNextGoal,
        cards: mergedCards,
        totalHours: mergedCards.reduce((acc, card) => acc + (card.hours || 0), 0),
        isCompleted: false,
      };
      await saveWeeklyGoal(updatedGoal);
    } else {
      // Create a fresh goal in next week for rolled over cards
      const newGoalId = `goal_rolled_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newCards = uncompletedCards.map((c, idx) => ({
        ...c,
        id: `card_${newGoalId}_${idx + 1}`,
        goalId: newGoalId,
        assignedDate: null,
      }));

      const rolledGoal = {
        id: newGoalId,
        weekKey: nextWeekKey,
        title: goal.title,
        description: goal.description || '',
        totalHours: newCards.reduce((acc, c) => acc + (c.hours || 0), 0),
        partitionType: goal.partitionType || 'hours',
        partitionValue: goal.partitionValue || 1,
        colorTheme: goal.colorTheme || 'indigo',
        cards: newCards,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveWeeklyGoal(rolledGoal);
    }
  }

  return { rolledCount, nextWeekKey };
}
