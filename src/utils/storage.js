/**
 * @module storage
 *
 * This module provides a set of utility functions for persisting task data
 * using IndexedDB (via Dexie) with localStorage fallback for synchronous operations.
 * 
 * BACKWARD COMPATIBILITY: loadTasks() and loadTodos() remain synchronous to support
 * existing code. They read from localStorage on first load and IndexedDB migration
 * happens in the background.
 * 
 * MIGRATION: On app initialization, existing localStorage data is automatically
 * migrated to IndexedDB for better performance and larger storage capacity.
 */

import db, { needsMigration, markMigrationComplete, saveSetting, loadSetting } from './db';

// Storage keys
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
    }

    // Migrate todos
    const savedTodos = localStorage.getItem(TODOS_STORAGE_KEY);
    if (savedTodos) {
      const todos = JSON.parse(savedTodos);
      if (Array.isArray(todos) && todos.length > 0) {
        await db.todos.bulkPut(todos);
        console.log(`Migrated ${todos.length} todos to IndexedDB`);
      }
    }

    // Migrate settings
    const theme = localStorage.getItem('theme');
    if (theme) {
      await saveSetting('theme', theme);
    }

    const availableHours = localStorage.getItem('availableHours');
    if (availableHours) {
      await saveSetting('availableHours', JSON.parse(availableHours));
    }

    const dailyTipIndex = localStorage.getItem('dailyTipIndex');
    if (dailyTipIndex) {
      await saveSetting('dailyTipIndex', JSON.parse(dailyTipIndex));
    }

    // Mark migration as complete
    await markMigrationComplete();
    console.log('Migration complete!');
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
 * Retrieves the list of tasks from localStorage (synchronous for backward compatibility).
 * For new code, use loadTasksAsync() instead.
 * @returns {Array<Object>} An array of task objects.
 */
export const loadTasks = () => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
  }

  // Fallback to default tasks if no valid data is found.
  return DEFAULT_TASKS;
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
    // Fall back to localStorage if IndexedDB is empty
    return loadTasks();
  } catch (error) {
    console.error('Error loading tasks from IndexedDB:', error);
    return loadTasks(); // Fall back to localStorage
  }
};

/**
 * Saves tasks to both localStorage and IndexedDB.
 * @param {Array<Object>} tasks - The array of task objects to save.
 */
export const saveTasks = (tasks) => {
  try {
    // Save to localStorage (synchronous, immediate)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

    // Also save to IndexedDB (async, in background)
    saveTasksAsync(tasks).catch(error => {
      console.error('Error saving tasks to IndexedDB:', error);
    });
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
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
  try {
    localStorage.removeItem(STORAGE_KEY);
    db.tasks.clear().catch(error => {
      console.error('Error clearing tasks from IndexedDB:', error);
    });
  } catch (error) {
    console.error('Error clearing tasks from localStorage:', error);
  }
};

/**
 * Exports both tasks and TODOs to a downloadable JSON file.
 * @param {Array<Object>} tasks - The array of task objects to export.
 * @param {Array<Object>} todos - The array of TODO objects to export.
 */
export const exportAllData = (tasks, todos) => {
  try {
    const data = {
      tasks,
      todos,
      exportDate: new Date().toISOString(),
      version: '2.0' // Updated version for IndexedDB format
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
  }
};

/**
 * Imports tasks and TODOs from a user-selected JSON file.
 * Supports both legacy (array of tasks) and new (object with tasks and todos) formats.
 * @param {File} file - The JSON file object.
 * @returns {Promise<{tasks: Array<Object>, todos: Array<Object>}>}
 */
export const importAllData = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            // Legacy format: just tasks
            resolve({ tasks: data, todos: [] });
          } else if (typeof data === 'object' && data !== null) {
            // New format: { tasks, todos }
            const tasks = Array.isArray(data.tasks) ? data.tasks : [];
            const todos = Array.isArray(data.todos) ? data.todos : [];
            resolve({ tasks, todos });
          } else {
            reject(new Error('Invalid file format: The JSON file must contain an array or an object with tasks and todos.'));
          }
        } catch (parseError) {
          console.error('Error parsing JSON file:', parseError);
          reject(new Error('The selected file is not a valid JSON file.'));
        }
      };
      reader.onerror = () => reject(new Error('An error occurred while reading the file.'));
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Imports events from an iCalendar (.ics) file and converts them into task objects.
 * @param {File} file - The .ics file selected by the user.
 * @returns {Promise<Array<Object>>} Resolves to an array of task-like objects.
 */
export const importICS = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/);

          const events = [];
          let inEvent = false;
          let current = {};

          const flushEvent = () => {
            if (Object.keys(current).length > 0) {
              events.push({ ...current });
            }
            current = {};
          };

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
              flushEvent();
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

          // Helpers
          const pad = (n) => n.toString().padStart(2, '0');

          function parseICSTime(val) {
            const utc = val.endsWith('Z');
            const core = val.replace(/Z$/i, '');
            const m = core.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
            if (!m) return null;
            const year = Number(m[1]);
            const month = Number(m[2]);
            const day = Number(m[3]);
            const hour = Number(m[4]);
            const minute = Number(m[5]);
            const second = m[6] ? Number(m[6]) : 0;
            if (utc) {
              const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}Z`;
              return new Date(iso);
            }
            return new Date(year, month - 1, day, hour, minute, second);
          }

          function formatDate(date) {
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          }

          function formatTime(date) {
            return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
          }

          function parseRRULE(rruleStr) {
            const obj = {};
            const parts = rruleStr.split(';');
            for (const p of parts) {
              const [k, v] = p.split('=');
              obj[k] = v;
            }
            return obj;
          }

          function weekdayStrToNum(s) {
            const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
            return map[s];
          }

          const tasks = [];
          let idCounter = Date.now();

          for (const ev of events) {
            try {
              const summary = ev['SUMMARY'] ? ev['SUMMARY'][0].value : 'Untitled Event';
              const description = ev['DESCRIPTION'] ? ev['DESCRIPTION'][0].value : '';
              const dtStartRaw = ev['DTSTART'] ? ev['DTSTART'][0].value : null;
              const dtEndRaw = ev['DTEND'] ? ev['DTEND'][0].value : null;
              const rruleRaw = ev['RRULE'] ? ev['RRULE'][0].value : null;

              if (!dtStartRaw) continue;

              const startDateObj = parseICSTime(dtStartRaw);
              if (!startDateObj) continue;

              let durationMin = 60;
              if (dtEndRaw) {
                const endDateObj = parseICSTime(dtEndRaw);
                if (endDateObj) {
                  durationMin = Math.max(1, Math.round((endDateObj - startDateObj) / 60000));
                }
              }

              const baseTask = {
                title: summary,
                description,
                priority: 'medium',
                estimatedDuration: durationMin,
                isCompleted: false,
                assignedSlot: null,
              };

              if (!rruleRaw) {
                tasks.push({
                  ...baseTask,
                  id: idCounter++,
                  dueDate: formatDate(startDateObj),
                  dueTime: formatTime(startDateObj),
                });
              } else {
                const r = parseRRULE(rruleRaw);
                const freq = (r.FREQ || 'DAILY').toUpperCase();
                const until = r.UNTIL ? parseICSTime(r.UNTIL) : null;
                const byday = r.BYDAY ? r.BYDAY.split(',') : null;

                if (freq === 'DAILY') {
                  const maxLoop = 1000;
                  let cur = new Date(startDateObj);
                  let count = 0;
                  while (true) {
                    if (until && cur > until) break;
                    tasks.push({
                      ...baseTask,
                      id: idCounter++,
                      dueDate: formatDate(cur),
                      dueTime: formatTime(cur),
                    });
                    cur.setDate(cur.getDate() + 1);
                    if (++count > maxLoop) break;
                  }
                } else if (freq === 'WEEKLY') {
                  const maxLoop = 1000;
                  let weekdays = [];
                  if (byday && byday.length > 0) {
                    weekdays = byday.map(weekdayStrToNum).filter((n) => typeof n === 'number');
                  } else {
                    weekdays = [startDateObj.getDay()];
                  }

                  let weekStart = new Date(startDateObj);
                  weekStart.setHours(0, 0, 0, 0);

                  let loops = 0;
                  while (true) {
                    for (const wd of weekdays) {
                      const diff = (wd - weekStart.getDay() + 7) % 7;
                      const occ = new Date(weekStart);
                      occ.setDate(occ.getDate() + diff);
                      occ.setHours(startDateObj.getHours(), startDateObj.getMinutes(), startDateObj.getSeconds(), 0);
                      if (occ < startDateObj) continue;
                      if (until && occ > until) continue;
                      if (!until && occ < startDateObj) continue;
                      if (tasks.length > 10000) break;
                      tasks.push({
                        ...baseTask,
                        id: idCounter++,
                        dueDate: formatDate(occ),
                        dueTime: formatTime(occ),
                      });
                    }
                    weekStart.setDate(weekStart.getDate() + 7);
                    if (until && weekStart > until) break;
                    if (++loops > maxLoop) break;
                  }
                } else {
                  tasks.push({
                    ...baseTask,
                    id: idCounter++,
                    dueDate: formatDate(startDateObj),
                    dueTime: formatTime(startDateObj),
                    description: `${description}\n\n(Recurrence: ${rruleRaw})`,
                  });
                }
              }
            } catch (err) {
              console.error('Failed to parse event', err);
            }
          }

          resolve(tasks);
        } catch (parseError) {
          console.error('Error parsing ICS file:', parseError);
          reject(new Error('The selected file is not a valid ICS file.'));
        }
      };
      reader.onerror = () => reject(new Error('An error occurred while reading the file.'));
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

// ===========================================================================
// TODO STORAGE (Synchronous with IndexedDB background sync)
// ===========================================================================

/**
 * Loads simple TODO items from localStorage (synchronous for backward compatibility).
 * @returns {Array} Array of TODO objects.
 */
export function loadTodos() {
  try {
    const stored = localStorage.getItem(TODOS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Failed to load TODOs from storage:', error);
    return [];
  }
}

/**
 * Loads simple TODO items from IndexedDB (asynchronous).
 * @returns {Promise<Array>} Array of TODO objects.
 */
export async function loadTodosAsync() {
  try {
    const todos = await db.todos.toArray();
    if (todos.length > 0) {
      return todos;
    }
    // Fall back to localStorage
    return loadTodos();
  } catch (error) {
    console.error('Failed to load TODOs from IndexedDB:', error);
    return loadTodos();
  }
}

/**
 * Saves simple TODO items to both localStorage and IndexedDB.
 * @param {Array} todos - Array of TODO objects to save.
 */
export function saveTodos(todos) {
  try {
    // Save to localStorage (synchronous)
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));

    // Also save to IndexedDB (async, in background)
    saveTodosAsync(todos).catch(error => {
      console.error('Error saving TODOs to IndexedDB:', error);
    });
  } catch (error) {
    console.error('Failed to save TODOs to storage:', error);
    throw new Error('Unable to save TODOs. Your browser storage might be full.');
  }
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
 * Loads a setting from IndexedDB with localStorage fallback.
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
    // Fallback to localStorage
    const localValue = localStorage.getItem(key);
    if (localValue) {
      try {
        return JSON.parse(localValue);
      } catch {
        return localValue;
      }
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
