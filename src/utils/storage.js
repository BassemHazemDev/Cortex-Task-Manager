/**
 * @module storage
 *
 * This module provides a set of utility functions for persisting task data
 * using IndexedDB (via Dexie).
 * 
 * BACKWARD COMPATIBILITY: loadTasks() and loadTodos() are maintained but now
 * return default/empty values immediately while async loading happens in background.
 * 
 * MIGRATION: On app initialization, existing localStorage data is automatically
 * migrated to IndexedDB and then CLEARED from localStorage.
 */

import db, { needsMigration, markMigrationComplete, saveSetting, loadSetting } from './db';

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
 * Exports both tasks, TODOs, and settings to a downloadable JSON file.
 * fetches data from IndexedDB to ensure the latest state is exported.
 */
export const exportAllData = async () => {
  try {
    const tasks = await loadTasksAsync();
    const todos = await loadTodosAsync();
    const settingsArray = await db.settings.toArray();

    // Convert settings array back to object
    const settings = settingsArray.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    const data = {
      tasks,
      todos,
      settings,
      exportDate: new Date().toISOString(),
      version: '2.0' // IndexedDB format
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

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
 * Imports tasks and TODOs from a user-selected JSON file.
 * Saves directly to IndexedDB and returns data for context refresh.
 * @param {File} file - The JSON file object.
 * @returns {Promise<{tasks: Array<Object>, todos: Array<Object>}>}
 */
export const importAllData = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const tasks = Array.isArray(data) ? data : (data.tasks || []);
        const todos = data.todos || [];

        // Save to IndexedDB
        await db.transaction('rw', db.tasks, db.todos, db.settings, async () => {
          // Update Tasks
          await db.tasks.clear();
          if (tasks.length > 0) {
            await db.tasks.bulkAdd(tasks);
          }

          // Update Todos
          await db.todos.clear();
          if (todos.length > 0) {
            await db.todos.bulkAdd(todos);
          }

          // Update Settings if present
          if (data.settings) {
            for (const [key, value] of Object.entries(data.settings)) {
              await saveSetting(key, value);
            }
          }
        });

        resolve({ tasks, todos });
      } catch (error) {
        console.error('Error importing data:', error);
        reject(new Error('Failed to import data. Invalid file format or storage error.'));
      }
    };

    reader.onerror = () => reject(new Error('An error occurred while reading the file.'));
    reader.readAsText(file);
  });
};

/**
 * Imports events from an iCalendar (.ics) file and converts them into task objects.
 * @param {File} file - The .ics file selected by the user.
 * @returns {Promise<{tasks: Array<Object>, stats: {imported: number, failed: number}}>} 
 */
export const importICS = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);

        const events = [];
        let inEvent = false;
        let current = {};

        // Fold lines according to RFC5545
        const unfolded = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (i > 0 && (line.startsWith(' ') || line.startsWith('\t'))) {
            unfolded[unfolded.length - 1] += line.slice(1);
          } else {
            unfolded.push(line);
          }
        }

        for (const raw of unfolded) {
          const line = raw.trim();
          if (!line) continue;
          if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            current = {};
            continue;
          }
          if (line === 'END:VEVENT') {
            inEvent = false;
            if (Object.keys(current).length > 0) events.push(current);
            current = {};
            continue;
          }
          if (!inEvent) continue;

          const idx = line.indexOf(':');
          if (idx === -1) continue;
          const namePart = line.slice(0, idx);
          const value = line.slice(idx + 1);
          const [nameRaw, ...paramParts] = namePart.split(';');
          const name = nameRaw.toUpperCase();

          if (!current[name]) current[name] = [];
          current[name].push({ params: paramParts, value });
        }

        const tasks = [];
        let idCounter = Date.now();
        let failedCount = 0;

        // Helper to parse ICS date string
        const parseICSTime = (val) => {
          if (!val) return null;
          try {
            const utc = val.endsWith('Z');
            const core = val.replace(/Z$/i, '');
            const m = core.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
            if (!m) return null; // Or handle date-only: YYYYMMDD

            // Handle date-only (if match fails above, might implement date-only check here)
            // But strict regex above requires T. Standard allows date-only for DTSTART/DTEND.

            const year = Number(m[1]);
            const month = Number(m[2]) - 1; // JS months are 0-based
            const day = Number(m[3]);
            const hour = Number(m[4]);
            const minute = Number(m[5]);
            const second = m[6] ? Number(m[6]) : 0;

            if (utc) {
              return new Date(Date.UTC(year, month, day, hour, minute, second));
            }
            return new Date(year, month, day, hour, minute, second);
          } catch (e) {
            return null;
          }
        };

        const pad = (n) => n.toString().padStart(2, '0');
        const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

        for (const ev of events) {
          try {
            const summary = ev['SUMMARY']?.[0]?.value || 'Untitled Event';
            const description = ev['DESCRIPTION']?.[0]?.value || '';
            const dtStartRaw = ev['DTSTART']?.[0]?.value;
            const dtEndRaw = ev['DTEND']?.[0]?.value;

            if (!dtStartRaw) {
              failedCount++;
              continue;
            }

            // Handle date-only DTSTART (no T)
            let startDateObj = null;
            if (dtStartRaw.length === 8 && !dtStartRaw.includes('T')) {
              const y = parseInt(dtStartRaw.substring(0, 4));
              const m = parseInt(dtStartRaw.substring(4, 6)) - 1;
              const d = parseInt(dtStartRaw.substring(6, 8));
              startDateObj = new Date(y, m, d, 9, 0); // Default to 9 AM for all-day events?
              // Or mark as all-day? Task manager seems to expect time.
            } else {
              startDateObj = parseICSTime(dtStartRaw);
            }

            if (!startDateObj) {
              failedCount++;
              continue;
            }

            let durationMin = 60;
            if (dtEndRaw) {
              let endDateObj = null;
              if (dtEndRaw.length === 8 && !dtEndRaw.includes('T')) {
                const y = parseInt(dtEndRaw.substring(0, 4));
                const m = parseInt(dtEndRaw.substring(4, 6)) - 1;
                const d = parseInt(dtEndRaw.substring(6, 8));
                endDateObj = new Date(y, m, d, 10, 0);
              } else {
                endDateObj = parseICSTime(dtEndRaw);
              }

              if (endDateObj) {
                durationMin = Math.max(1, Math.round((endDateObj - startDateObj) / 60000));
              }
            }

            const baseTask = {
              id: idCounter++,
              title: summary,
              description: description,
              priority: 'medium',
              estimatedDuration: durationMin,
              isCompleted: false,
              assignedSlot: null,
              dueDate: formatDate(startDateObj),
              dueTime: formatTime(startDateObj)
            };

            tasks.push(baseTask);

          } catch (err) {
            console.warn('Skipping invalid event', err);
            failedCount++;
          }
        }

        resolve({ tasks, stats: { imported: tasks.length, failed: failedCount } });

      } catch (error) {
        console.error('Error parsing ICS file:', error);
        reject(new Error('Failed to parse ICS file.'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsText(file);
  });
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
