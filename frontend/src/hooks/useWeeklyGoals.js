import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadWeeklyGoalsForWeek,
  saveWeeklyGoal,
  deleteWeeklyGoal as removeWeeklyGoal,
  toggleGoalCardComplete,
  assignGoalCardDate,
  rolloverUnfinishedGoals,
} from '../utils/weeklyGoalsStorage';
import {
  generatePartitionCards,
  getSaturdayOfWeek,
  formatDateKey,
  getWeekKey,
  getNextWeekKey,
  getPrevWeekKey,
} from '../utils/weeklyGoalsUtils';
import { playCompleteSound } from '../utils/audioUtils';

/**
 * Custom hook to manage weekly goals for a specific weekKey.
 * @param {string} weekKey - The Saturday start date 'YYYY-MM-DD'
 */
export function useWeeklyGoals(weekKey) {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load goals whenever weekKey changes
  const fetchGoals = useCallback(async () => {
    if (!weekKey) return;
    setIsLoading(true);
    try {
      const data = await loadWeeklyGoalsForWeek(weekKey);
      setGoals(data);
    } catch (err) {
      console.error('Failed to load weekly goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  /**
   * Creates a new weekly goal with partitioned cards.
   */
  const createGoal = useCallback(
    async ({
      title,
      description = '',
      totalHours = 1,
      partitionType = 'hours',
      partitionValue = 1,
      colorTheme = 'indigo',
    }) => {
      const goalId = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const cards = generatePartitionCards({
        title,
        description,
        totalHours,
        partitionType,
        partitionValue,
        goalId,
      });

      const newGoal = {
        id: goalId,
        weekKey,
        title,
        description,
        totalHours: Number(totalHours),
        partitionType,
        partitionValue: Number(partitionValue),
        colorTheme,
        cards,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveWeeklyGoal(newGoal);
      setGoals((prev) => [...prev, newGoal]);
      return newGoal;
    },
    [weekKey]
  );

  /**
   * Deletes a weekly goal.
   */
  const deleteGoal = useCallback(
    async (goalId) => {
      await removeWeeklyGoal(goalId, weekKey);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    },
    [weekKey]
  );

  /**
   * Updates a weekly goal.
   */
  const updateGoal = useCallback(
    async (goalId, updates) => {
      const current = goals.find((g) => g.id === goalId);
      if (!current) return;
      const updated = { ...current, ...updates };
      await saveWeeklyGoal(updated);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    },
    [goals]
  );

  /**
   * Toggles completion of an individual card.
   */
  const toggleCard = useCallback(
    async (cardId) => {
      // Optimistic update
      let targetCardState = null;
      let soundPlayed = false;

      setGoals((prev) =>
        prev.map((goal) => {
          const cardIndex = goal.cards?.findIndex((c) => c.id === cardId);
          if (cardIndex >= 0) {
            const currentCard = goal.cards[cardIndex];
            const nextCompleted = !currentCard.isCompleted;
            targetCardState = nextCompleted;

            if (nextCompleted && !soundPlayed) {
              playCompleteSound();
              soundPlayed = true;
            }

            const updatedCards = [...goal.cards];
            updatedCards[cardIndex] = {
              ...currentCard,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            };

            return {
              ...goal,
              cards: updatedCards,
              isCompleted: updatedCards.every((c) => c.isCompleted),
            };
          }
          return goal;
        })
      );

      // Persist to storage
      await toggleGoalCardComplete(cardId, weekKey);
    },
    [weekKey]
  );

  /**
   * Assigns or moves a card to a specific date (or null to return to available deck).
   */
  const assignCard = useCallback(
    async (cardId, assignedDate) => {
      // Optimistic update
      setGoals((prev) =>
        prev.map((goal) => {
          const cardIndex = goal.cards?.findIndex((c) => c.id === cardId);
          if (cardIndex >= 0) {
            const updatedCards = [...goal.cards];
            updatedCards[cardIndex] = {
              ...updatedCards[cardIndex],
              assignedDate,
            };
            return {
              ...goal,
              cards: updatedCards,
            };
          }
          return goal;
        })
      );

      // Persist to storage
      await assignGoalCardDate(cardId, assignedDate, weekKey);
    },
    [weekKey]
  );

  /**
   * Rolls over uncompleted cards to next week.
   */
  const rolloverUnfinished = useCallback(async () => {
    const result = await rolloverUnfinishedGoals(weekKey);
    // Reload current week goals to ensure sync
    await fetchGoals();
    return result;
  }, [weekKey, fetchGoals]);

  // Derived metrics
  const metrics = useMemo(() => {
    let totalHours = 0;
    let completedHours = 0;
    let totalCardsCount = 0;
    let completedCardsCount = 0;
    const unassigned = [];
    const assignedMap = {}; // dateStr -> card[]

    for (const goal of goals) {
      const color = goal.colorTheme || 'indigo';
      totalHours += goal.totalHours || 0;

      for (const card of goal.cards || []) {
        totalCardsCount++;
        const cardWithGoalMeta = {
          ...card,
          goalTitle: goal.title,
          colorTheme: color,
        };

        if (card.isCompleted) {
          completedCardsCount++;
          completedHours += card.hours || 0;
        }

        if (card.assignedDate) {
          if (!assignedMap[card.assignedDate]) {
            assignedMap[card.assignedDate] = [];
          }
          assignedMap[card.assignedDate].push(cardWithGoalMeta);
        } else {
          unassigned.push(cardWithGoalMeta);
        }
      }
    }

    const percentage =
      totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

    return {
      totalHours: parseFloat(totalHours.toFixed(1)),
      completedHours: parseFloat(completedHours.toFixed(1)),
      percentage,
      totalCardsCount,
      completedCardsCount,
      uncompletedCardsCount: totalCardsCount - completedCardsCount,
      unassignedCards: unassigned,
      assignedCardsMap: assignedMap,
    };
  }, [goals]);

  return {
    goals,
    isLoading,
    createGoal,
    deleteGoal,
    updateGoal,
    toggleCard,
    assignCard,
    rolloverUnfinished,
    refetchGoals: fetchGoals,
    ...metrics,
  };
}
