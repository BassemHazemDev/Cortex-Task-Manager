/**
 * @module storage
 *
 * This module provides utility functions for importing/exporting data.
 * Now integrates with backend API for cloud sync.
 */

import db, { needsMigration, markMigrationComplete, saveSetting, loadSetting } from './db';
import apiClient from '../lib/api';
import { pad, formatDate, formatTime } from './dateUtils';

// Storage keys (Only used for migration now)
const STORAGE_KEY = 'cortex-task-manager-tasks';
const TODOS_STORAGE_KEY = 'cortex-task-manager-todos';

// Track migration status in memory
let migrationInitialized = false;

// A default set of tasks to populate the application when it's launched for the first time
const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Review project proposal",
    description: "Go through the Q1 project proposal and provide feedback",
    dueDate: "2025-01-15",
    dueTime: "14:00",
    priority: "high",
    estimatedDuration: 60,
    isCompleted: false,
    assignedSlot: null
  },
  {
    id: 2,
    title: "Team standup meeting",
    description: "Daily standup with the development team",
    dueDate: "2025-01-15",
    dueTime: "09:00",
    priority: "medium",
    estimatedDuration: 30,
    isCompleted: false,
    assignedSlot: null
  },
  {
    id: 3,
    title: "Update documentation",
    description: "Update the API documentation with recent changes",
    dueDate: "2025-01-16",
    dueTime: null,
    priority: "low",
    estimatedDuration: 120,
    isCompleted: true,
    assignedSlot: null
  }
];

/**
 * Migrates data from localStorage to IndexedDB.
 * Called once on first load if localStorage data exists.
 * @returns {Promise<void>}
 */
async function migrateFromLocalStorage() {
  try {
    console.log('Migrating data from localStorage to IndexedDB...');

    // Migrate tasks
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      if (Array.isArray(tasks) && tasks.length > 0) {
        await db.tasks.bulkPut(tasks);
        console.log(`Migrated ${tasks.length} tasks to IndexedDB`);
      }
      localStorage.removeItem(STORAGE_KEY); // Clear after migration
    }

    // Migrate todos
    const savedTodos = localStorage.getItem(TODOS_STORAGE_KEY);
    if (savedTodos) {
      const todos = JSON.parse(savedTodos);
      if (Array.isArray(todos) && todos.length > 0) {
        await db.todos.bulkPut(todos);
        console.log(`Migrated ${todos.length} todos to IndexedDB`);
      }
      localStorage.removeItem(TODOS_STORAGE_KEY); // Clear after migration
    }

    // Migrate settings
    const theme = localStorage.getItem('theme');
    if (theme) {
      await saveSetting('theme', theme);
      localStorage.removeItem('theme');
    }

    const availableHours = localStorage.getItem('availableHours');
    if (availableHours) {
      await saveSetting('availableHours', JSON.parse(availableHours));
      localStorage.removeItem('availableHours');
    }

    const dailyTipIndex = localStorage.getItem('dailyTipIndex');
    if (dailyTipIndex) {
      await saveSetting('dailyTipIndex', JSON.parse(dailyTipIndex));
      localStorage.removeItem('dailyTipIndex');
    }

    // Mark migration as complete
    await markMigrationComplete();
    console.log('Migration complete & localStorage cleared!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

/**
 * Initializes the storage system.
 * Checks for and performs migration from localStorage if needed.
 * This should be called early in app initialization.
 * @returns {Promise<void>}
 */
export async function initStorage() {
  if (migrationInitialized) return;
  migrationInitialized = true;

  try {
    if (await needsMigration()) {
      await migrateFromLocalStorage();
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * DEPRECATED: Synchronous load.
 * Retained for signature compatibility during refactor.
 * @returns {Array<Object>} Empty array or defaults.
 */
export const loadTasks = () => {
  // Return empty or defaults depending on logic
  // We want the app to rely on async load.
  // Returning empty array will let async load populate it.
  return [];
};

/**
 * Retrieves the list of tasks from IndexedDB (asynchronous).
 * @returns {Promise<Array<Object>>} An array of task objects.
 */
export const loadTasksAsync = async () => {
  try {
    const tasks = await db.tasks.toArray();
    if (tasks.length > 0) {
      return tasks;
    }
    // If DB is empty, user might be new. Return defaults?
    // Or maybe we should seed defaults into DB if completely empty?
    // Let's return DEFAULT_TASKS to be helpful, but also save them?
    // For now, just return DEFAULT_TASKS if truly empty (and not just cleared).
    // Actually, handling "cleared by user" vs "fresh install" is tricky.
    // Let's just return what's in DB. If empty, it's empty.

    // Check if we should seed defaults (only if we didn't migrate and it's 0)
    // For simplicity: if 0 tasks, return DEFAULT_TASKS (visual only) OR
    // seed them. Seeding is better for persistence. 
    // Let's seed if empty for now to maintain previous behavior.
    if (tasks.length === 0) {
      // Only if we truly think it's fresh?
      // Let's just return empty array and let the Context handle "defaults" logic if desired,
      // or return DEFAULT_TASKS. 
      // Logic in previous version: "Fall back to default tasks if no valid data is found."
      return DEFAULT_TASKS;
    }
    return tasks;
  } catch (error) {
    console.error('Error loading tasks from IndexedDB:', error);
    return [];
  }
};

/**
 * Saves tasks to IndexedDB.
 * @param {Array<Object>} tasks - The array of task objects to save.
 */
export const saveTasks = (tasks) => {
  // Fire and forget async save
  saveTasksAsync(tasks).catch(error => {
    console.error('Error saving tasks to IndexedDB:', error);
  });
};

/**
 * Saves tasks to IndexedDB (asynchronous).
 * @param {Array<Object>} tasks - The array of task objects to save.
 * @returns {Promise<void>}
 */
export const saveTasksAsync = async (tasks) => {
  try {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear();
      if (tasks.length > 0) {
        await db.tasks.bulkAdd(tasks);
      }
    });
  } catch (error) {
    console.error('Error saving tasks to IndexedDB:', error);
  }
};

/**
 * Removes all tasks from storage.
 */
export const clearTasks = () => {
  db.tasks.clear().catch(error => {
    console.error('Error clearing tasks from IndexedDB:', error);
  });
};

/**
 * Exports all user data from the backend and downloads as JSON file.
 */
export const exportAllData = async () => {
  try {
    const response = await apiClient.get('/data/export');
    const data = response.data.data;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cortex-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw error;
  }
};

/**
 * Imports tasks and TODOs from a user-selected JSON file via backend API.
 * @param {File} file - The JSON file object.
 * @returns {Promise<{tasksImported: number, todosImported: number}>}
 */
export const importAllData = async (file) => {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    const response = await apiClient.post('/data/import/json', json);
    return response.data; // { status: 'success', tasksImported, todosImported }
  } catch (error) {
    console.error('Error importing data:', error);
    const message = error.response?.data?.message || 'Failed to import data. Please ensure the file is a valid Cortex backup exported from the cloud.';
    throw new Error(message);
  }
};

/**
 * Imports events from an ICS file via backend API.
 * @param {File} file - The .ics file selected by the user.
 * @returns {Promise<{tasksAdded: number}>}
 */
export const importICS = async (file) => {
  try {
    const text = await file.text();
    const response = await apiClient.post('/data/import/ics', { file: text });
    return response.data; // { status: 'success', tasksAdded }
  } catch (error) {
    console.error('Error importing ICS:', error);
    throw new Error(error.response?.data?.message || 'Failed to import ICS file. Please try again.');
  }
};

// ===========================================================================
// TODO STORAGE (Async enforced, Sync deprecated)
// ===========================================================================

/**
 * DEPRECATED: Simple TODO items (synchronous stub).
 * @returns {Array} Empty array.
 */
export function loadTodos() {
  return [];
}

/**
 * Loads simple TODO items from IndexedDB (asynchronous).
 * @returns {Promise<Array>} Array of TODO objects.
 */
export async function loadTodosAsync() {
  try {
    const todos = await db.todos.toArray();
    if (todos.length > 0) {
      return todos.sort((a, b) => (a.order || a.id) - (b.order || b.id));
    }
    return [];
  } catch (error) {
    console.error('Failed to load TODOs from IndexedDB:', error);
    return [];
  }
}

/**
 * Saves simple TODO items to IndexedDB.
 * @param {Array} todos - Array of TODO objects to save.
 */
export function saveTodos(todos) {
  saveTodosAsync(todos).catch(error => {
    console.error('Error saving TODOs to IndexedDB:', error);
  });
}

/**
 * Saves simple TODO items to IndexedDB (asynchronous).
 * @param {Array} todos - Array of TODO objects to save.
 * @returns {Promise<void>}
 */
export async function saveTodosAsync(todos) {
  try {
    await db.transaction('rw', db.todos, async () => {
      await db.todos.clear();
      if (todos.length > 0) {
        await db.todos.bulkAdd(todos);
      }
    });
  } catch (error) {
    console.error('Failed to save TODOs to IndexedDB:', error);
  }
}

// ===========================================================================
// SETTINGS STORAGE
// ===========================================================================

/**
 * Loads a setting from IndexedDB with NO localStorage fallback.
 * @param {string} key - The setting key.
 * @param {any} defaultValue - Default value if not found.
 * @returns {Promise<any>} The setting value.
 */
export async function loadAppSetting(key, defaultValue = null) {
  try {
    const value = await loadSetting(key, null);
    if (value !== null) {
      return value;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Failed to load setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Saves a setting to IndexedDB.
 * @param {string} key - The setting key.
 * @param {any} value - The setting value.
 * @returns {Promise<void>}
 */
export async function saveAppSetting(key, value) {
  try {
    await saveSetting(key, value);
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
  }
}
