/**
 * @module TaskContext
 * 
 * Provides task-related state and operations including:
 * - Tasks array state
 * - CRUD operations (add, update, delete)
 * - Task completion toggle
 * - Time conflict detection
 * - Auto-save to IndexedDB
 * 
 * Note: This context handles data only. Notifications should be
 * displayed by the consuming components using AppContext.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadTasks, loadTasksAsync, saveTasks, initStorage } from '../utils/storage';
import { playCompleteSound } from '../utils/audioUtils';
import { useCrossTabSync, broadcastSync } from '../hooks/useCrossTabSync';

const TaskContext = createContext(null);

/**
 * Custom hook to access the Task context.
 * @returns {Object} Task context value
 * @throws {Error} If used outside of TaskProvider
 */
export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

/**
 * TaskProvider component that manages task state and operations.
 */
export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSyncing = useRef(false);

  // Initialize storage and trigger migration on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initStorage();
        const loadedTasks = await loadTasksAsync();
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error initializing storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Handle cross-tab sync
  const handleSync = useCallback(async (type) => {
    if (type === 'tasks') {
      try {
        const newTasks = await loadTasksAsync();
        isSyncing.current = true; // Prevent echo
        setTasks(newTasks);
      } catch (error) {
        console.error('Error syncing tasks:', error);
      }
    }
  }, []);

  useCrossTabSync(handleSync);

  // Save tasks to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      if (isSyncing.current) {
        isSyncing.current = false;
        return;
      }
      saveTasks(tasks);
      broadcastSync('TASKS_UPDATED');
    }
  }, [tasks, isLoading]);

  /**
   * Checks if a new task would conflict with existing tasks.
   * @param {Object} newTask - The task to check
   * @param {Array} existingTasks - Array of existing tasks (defaults to current tasks)
   * @returns {boolean} True if there's a conflict
   */
  const hasTimeConflict = useCallback((newTask, existingTasks = tasks) => {
    if (!newTask.dueDate || !newTask.dueTime || !newTask.estimatedDuration) {
      return false;
    }
    
    const newStart = new Date(`${newTask.dueDate}T${newTask.dueTime}`);
    const newEnd = new Date(newStart.getTime() + newTask.estimatedDuration * 60000);
    
    return existingTasks.some((task) => {
      // Skip if it's the same task (for updates)
      if (task.id === newTask.id) return false;
      
      if (
        task.isCompleted ||
        task.dueDate !== newTask.dueDate ||
        !task.dueTime ||
        !task.estimatedDuration
      ) {
        return false;
      }
      const start = new Date(`${task.dueDate}T${task.dueTime}`);
      const end = new Date(start.getTime() + task.estimatedDuration * 60000);
      // Overlap: startA < endB && startB < endA
      return newStart < end && start < newEnd;
    });
  }, [tasks]);

  /**
   * Adds a new task.
   * @param {Object} taskData - The task data
   * @returns {{ success: boolean, message?: string, tasksAdded?: number }}
   */
  const addTask = useCallback((taskData) => {
    // Handle recurring tasks
    if (taskData.repeatUntil && taskData.repeatFrequency !== 'none' && taskData.dueDate) {
      const repeatedTasks = [];
      let currentDate = new Date(`${taskData.dueDate}T${taskData.dueTime || '00:00'}`);
      const repeatUntilDate = new Date(`${taskData.repeatUntil}T${taskData.dueTime || '00:00'}`);
      let i = 0;
      let conflictFound = false;

      const pad = (n) => n.toString().padStart(2, '0');

      while (currentDate <= repeatUntilDate) {
        const candidateDate = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
        const candidateTime = `${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;
        const candidate = { ...taskData, dueDate: candidateDate, dueTime: candidateTime };

        if (hasTimeConflict(candidate, [...tasks, ...repeatedTasks])) {
          conflictFound = true;
          break;
        }

        repeatedTasks.push({
          ...candidate,
          id: Date.now() + i,
          isCompleted: false,
          assignedSlot: null,
        });

        // Increment date based on frequency
        switch (taskData.repeatFrequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            break;
        }
        i++;
      }

      if (conflictFound) {
        return { 
          success: false, 
          message: 'One or more repeated tasks overlap with existing tasks.' 
        };
      }

      setTasks(prev => [...prev, ...repeatedTasks]);
      return { 
        success: true, 
        tasksAdded: repeatedTasks.length,
        message: `${repeatedTasks.length} tasks created (${taskData.repeatFrequency} until ${taskData.repeatUntil})`
      };
    }

    // Single task
    if (hasTimeConflict(taskData)) {
      return { 
        success: false, 
        message: 'This task overlaps with an existing task.' 
      };
    }

    const newTask = {
      ...taskData,
      id: Date.now(),
      isCompleted: false,
      assignedSlot: null,
    };

    setTasks(prev => [...prev, newTask]);
    return { success: true, task: newTask };
  }, [tasks, hasTimeConflict]);

  /**
   * Updates an existing task.
   * @param {number} taskId - The task ID to update
   * @param {Object} updates - The updates to apply
   * @returns {{ success: boolean, message?: string }}
   */
  const updateTask = useCallback((taskId, updates) => {
    const taskToUpdate = { ...tasks.find(t => t.id === taskId), ...updates, id: taskId };
    
    if (hasTimeConflict(taskToUpdate)) {
      return { 
        success: false, 
        message: 'This task overlaps with an existing task.' 
      };
    }

    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    
    return { success: true };
  }, [tasks, hasTimeConflict]);

  /**
   * Deletes a task.
   * @param {number} taskId - The task ID to delete
   * @returns {Object} The deleted task
   */
  const deleteTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    return task;
  }, [tasks]);

  /**
   * Toggles the completion status of a task.
   * @param {number} taskId - The task ID to toggle
   * @returns {{ task: Object, newStatus: boolean }}
   */
  const toggleTaskComplete = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newStatus = !task?.isCompleted;

    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, isCompleted: newStatus } : t
    ));

    if (newStatus) {
      playCompleteSound();
    }

    return { task, newStatus };
  }, [tasks]);

  /**
   * Toggles the completion status of a subtask.
   * @param {number} taskId - The parent task ID
   * @param {number} subtaskId - The subtask ID
   */
  const toggleSubtaskComplete = useCallback((taskId, subtaskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      
      const subtasks = task.subtasks || [];
      const updatedSubtasks = subtasks.map(st => 
        st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
      );
      
      return { ...task, subtasks: updatedSubtasks };
    }));
  }, []);

  /**
   * Adds a subtask to a task.
   * @param {number} taskId - Parent task ID
   * @param {Object} subtask - Subtask data
   */
  const addSubtask = useCallback((taskId, subtask) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: [...(task.subtasks || []), { ...subtask, id: Date.now(), isCompleted: false }]
      };
    }));
  }, []);

  /**
   * Updates a subtask.
   * @param {number} taskId - Parent task ID
   * @param {number} subtaskId - Subtask ID
   * @param {Object} updates - Updates to apply
   */
  const updateSubtask = useCallback((taskId, subtaskId, updates) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: (task.subtasks || []).map(st => 
          st.id === subtaskId ? { ...st, ...updates } : st
        )
      };
    }));
  }, []);

  /**
   * Deletes a subtask.
   * @param {number} taskId - Parent task ID
   * @param {number} subtaskId - Subtask ID
   */
  const deleteSubtask = useCallback((taskId, subtaskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId)
      };
    }));
  }, []);

  /**
   * Gets all pending (incomplete) tasks.
   */
  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => !task.isCompleted);
  }, [tasks]);

  /**
   * Gets all completed tasks.
   */
  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.isCompleted);
  }, [tasks]);

  const value = {
    tasks,
    setTasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubtaskComplete,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    hasTimeConflict,
    getPendingTasks,
    getCompletedTasks,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export default TaskContext;
