/**
 * @module db
 * 
 * IndexedDB database configuration using Dexie.
 * This replaces localStorage for better performance and larger storage capacity.
 */

import Dexie from 'dexie';

/**
 * Cortex Task Manager IndexedDB database.
 * Uses Dexie for a cleaner API over raw IndexedDB.
 */
export const db = new Dexie('CortexTaskManager');

// Define database schema
// Version 1: Initial schema
db.version(1).stores({
    tasks: '++id, dueDate, priority, isCompleted',
    todos: '++id, isCompleted',
    settings: 'key'
});

// Version 2: Added order for todos and templates
db.version(2).stores({
    tasks: '++id, dueDate, priority, isCompleted',
    todos: '++id, isCompleted, order',
    settings: 'key',
    templates: '++id' // For Part 5: Task Templates
});

/**
 * Saves a setting to the settings table.
 * 
 * @param {string} key - The setting key
 * @param {any} value - The setting value (will be JSON-serializable)
 */
export async function saveSetting(key, value) {
    await db.settings.put({ key, value });
}

/**
 * Loads a setting from the settings table.
 * 
 * @param {string} key - The setting key
 * @param {any} defaultValue - Default value if setting doesn't exist
 * @returns {Promise<any>} The setting value
 */
export async function loadSetting(key, defaultValue = null) {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
}

/**
 * Checks if this is the first time the app is running with IndexedDB.
 * Used to trigger migration from localStorage.
 * 
 * @returns {Promise<boolean>} True if migration is needed
 */
export async function needsMigration() {
    const migrated = await loadSetting('_migrated', false);
    const hasLocalStorageData = localStorage.getItem('cortex-task-manager-tasks') !== null;
    return !migrated && hasLocalStorageData;
}

/**
 * Marks the migration as complete.
 */
export async function markMigrationComplete() {
    await saveSetting('_migrated', true);
}

export default db;
