/**
 * @module storage
 *
 * This module provides a set of utility functions for persisting task data
 * to the browser's localStorage. It handles the core logic for loading, saving,
 * clearing, importing, and exporting tasks, abstracting the storage mechanism
 * from the rest of the application.
 */

// The unique key used to store and retrieve the task list within localStorage.
// Using a specific key prevents potential conflicts with other applications or libraries.
const STORAGE_KEY = 'cortex-task-manager-tasks'

// A default set of tasks to populate the application when it's launched for the first time
// or when no tasks are found in localStorage. This provides an initial state for new users
// and serves as a demonstration of the application's features.
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
]

/**
 * Retrieves the list of tasks from localStorage.
 * If no tasks are found, or if there's an error parsing the stored data,
 * it returns a default set of tasks. This ensures the application always
 * has a valid initial state.
 * @returns {Array<Object>} An array of task objects.
 */
export const loadTasks = () => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY)
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks)
      // We must validate that the parsed data is an array to prevent runtime errors.
      if (Array.isArray(parsedTasks)) {
        return parsedTasks
      }
    }
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error)
  }
  
  // Fallback to default tasks if no valid data is found.
  return DEFAULT_TASKS
}

/**
 * Serializes the given array of tasks and persists it to localStorage.
 * This operation overwrites any previously stored task list under the same key.
 * @param {Array<Object>} tasks - The array of task objects to save.
 */
export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error)
  }
}

/**
 * Removes the task list from localStorage. This is a destructive operation
 * used for resetting the application state.
 */
export const clearTasks = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing tasks from localStorage:', error)
  }
}

/**
 * Exports the current list of tasks to a downloadable JSON file.
 * This function creates a data Blob, generates a temporary URL for it,
 * and programmatically triggers a download link. The link is then removed
 * from the DOM to avoid clutter.
 * @param {Array<Object>} tasks - The array of task objects to export for backup.
 */
export const exportTasks = (tasks) => {
  try {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `cortex-tasks-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the created object URL to free memory.
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting tasks:', error)
  }
}

/**
 * Imports tasks from a user-selected JSON file.
 * This function reads the file content, parses it, and validates that the structure
 * is an array. It returns a Promise that either resolves with the parsed array of
 * tasks or rejects if an error occurs during reading, parsing, or validation.
 * @param {File} file - The JSON file object, typically from a file input element.
 * @returns {Promise<Array<Object>>} A Promise that resolves with the imported array of tasks.
 */
export const importTasks = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const tasks = JSON.parse(e.target.result)
          if (Array.isArray(tasks)) {
            resolve(tasks)
          } else {
            reject(new Error('Invalid file format: The JSON file must contain an array of tasks.'))
          }
        } catch (parseError) {
          console.error('Error parsing JSON file:', parseError)
          reject(new Error('The selected file is not a valid JSON file.'))
        }
      }
      reader.onerror = () => reject(new Error('An error occurred while reading the file.'))
      reader.readAsText(file)
    } catch (error) {
      reject(error)
    }
  })
}
