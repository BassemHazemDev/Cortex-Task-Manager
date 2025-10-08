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
 * Exports both tasks and TODOs to a downloadable JSON file.
 * The file will contain an object with { tasks, todos }.
 * @param {Array<Object>} tasks - The array of task objects to export.
 * @param {Array<Object>} todos - The array of TODO objects to export.
 */
export const exportAllData = (tasks, todos) => {
  try {
    const data = {
      tasks,
      todos,
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
 * Returns a Promise that resolves with { tasks, todos }.
 * @param {File} file - The JSON file object, typically from a file input element.
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
 * Supports basic VEVENT parsing and simple recurrence expansion for DAILY and
 * WEEKLY rules with BYDAY and UNTIL. For timezone-bearing DTSTART (e.g.
 * DTSTART;TZID=...) the parser treats the time as local (naive) unless a
 * trailing Z (UTC) is present.
 *
 * @param {File} file - The .ics file selected by the user.
 * @returns {Promise<Array<Object>>} Resolves to an array of task-like objects.
 */
export const importICS = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split(/\r?\n/)

          const events = []
          let inEvent = false
          let current = {}

          const flushEvent = () => {
            if (Object.keys(current).length > 0) {
              events.push({ ...current })
            }
            current = {}
          }

          // Fold lines according to RFC5545 (lines that start with space are continuations)
          const unfolded = []
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (i > 0 && (line.startsWith(' ') || line.startsWith('\t'))) {
              unfolded[unfolded.length - 1] += line.slice(1)
            } else {
              unfolded.push(line)
            }
          }

          for (const raw of unfolded) {
            const line = raw.trim()
            if (!line) continue
            if (line === 'BEGIN:VEVENT') {
              inEvent = true
              current = {}
              continue
            }
            if (line === 'END:VEVENT') {
              inEvent = false
              flushEvent()
              continue
            }
            if (!inEvent) continue

            const idx = line.indexOf(':')
            if (idx === -1) continue
            const namePart = line.slice(0, idx)
            const value = line.slice(idx + 1)
            const [nameRaw, ...paramParts] = namePart.split(';')
            const name = nameRaw.toUpperCase()
            // Keep parameters if necessary (e.g., TZID)
            if (!current[name]) current[name] = []
            current[name].push({ params: paramParts, value })
          }

          // Helpers
          const pad = (n) => n.toString().padStart(2, '0')

          function parseICSTime(val) {
            // Examples: 20250901T120000Z, 20250830T160000
            const utc = val.endsWith('Z')
            const core = val.replace(/Z$/i, '')
            const m = core.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/)
            if (!m) return null
            const year = Number(m[1])
            const month = Number(m[2])
            const day = Number(m[3])
            const hour = Number(m[4])
            const minute = Number(m[5])
            const second = m[6] ? Number(m[6]) : 0
            if (utc) {
              // Construct ISO string with Z
              const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}Z`
              return new Date(iso)
            }
            // Treat as local naive time
            return new Date(year, month - 1, day, hour, minute, second)
          }

          function formatDate(date) {
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
          }

          function formatTime(date) {
            return `${pad(date.getHours())}:${pad(date.getMinutes())}`
          }

          function parseRRULE(rruleStr) {
            const obj = {}
            const parts = rruleStr.split(';')
            for (const p of parts) {
              const [k, v] = p.split('=')
              obj[k] = v
            }
            return obj
          }

          function weekdayStrToNum(s) {
            const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
            return map[s]
          }

          const tasks = []
          let idCounter = Date.now()

          for (const ev of events) {
            try {
              const summary = ev['SUMMARY'] ? ev['SUMMARY'][0].value : 'Untitled Event'
              const description = ev['DESCRIPTION'] ? ev['DESCRIPTION'][0].value : ''
              const dtStartRaw = ev['DTSTART'] ? ev['DTSTART'][0].value : null
              const dtEndRaw = ev['DTEND'] ? ev['DTEND'][0].value : null
              const rruleRaw = ev['RRULE'] ? ev['RRULE'][0].value : null

              if (!dtStartRaw) {
                // Skip events without start
                continue
              }

              const startDateObj = parseICSTime(dtStartRaw)
              if (!startDateObj) continue

              let durationMin = 60
              if (dtEndRaw) {
                const endDateObj = parseICSTime(dtEndRaw)
                if (endDateObj) {
                  durationMin = Math.max(1, Math.round((endDateObj - startDateObj) / 60000))
                }
              }

              const baseTask = {
                title: summary,
                description,
                priority: 'medium',
                estimatedDuration: durationMin,
                isCompleted: false,
                assignedSlot: null,
              }

              if (!rruleRaw) {
                // Single occurrence
                const d = startDateObj
                tasks.push({
                  ...baseTask,
                  id: idCounter++,
                  dueDate: formatDate(d),
                  dueTime: formatTime(d),
                })
              } else {
                // Attempt basic RRULE expansion for DAILY and WEEKLY with BYDAY and UNTIL
                const r = parseRRULE(rruleRaw)
                const freq = (r.FREQ || 'DAILY').toUpperCase()
                const until = r.UNTIL ? parseICSTime(r.UNTIL) : null
                const byday = r.BYDAY ? r.BYDAY.split(',') : null

                if (freq === 'DAILY') {
                  const maxLoop = 1000
                  let cur = new Date(startDateObj)
                  let count = 0
                  while (true) {
                    if (until && cur > until) break
                    tasks.push({
                      ...baseTask,
                      id: idCounter++,
                      dueDate: formatDate(cur),
                      dueTime: formatTime(cur),
                    })
                    cur.setDate(cur.getDate() + 1)
                    if (++count > maxLoop) break
                  }
                } else if (freq === 'WEEKLY') {
                  const maxLoop = 1000
                  // If BYDAY provided, expand on those weekdays, otherwise use DTSTART weekday
                  let weekdays = []
                  if (byday && byday.length > 0) {
                    weekdays = byday.map(weekdayStrToNum).filter((n) => typeof n === 'number')
                  } else {
                    weekdays = [startDateObj.getDay()]
                  }

                  // Start from the week containing DTSTART. We'll iterate week by week.
                  let weekStart = new Date(startDateObj)
                  // Normalize weekStart to the same day as DTSTART but with time 00:00
                  weekStart.setHours(0, 0, 0, 0)

                  let loops = 0
                  while (true) {
                    for (const wd of weekdays) {
                      // compute day in this week for weekday wd with same time as DTSTART
                      const diff = (wd - weekStart.getDay() + 7) % 7
                      const occ = new Date(weekStart)
                      occ.setDate(occ.getDate() + diff)
                      // set time from DTSTART
                      occ.setHours(startDateObj.getHours(), startDateObj.getMinutes(), startDateObj.getSeconds(), 0)
                      if (occ < startDateObj) continue
                      if (until && occ > until) continue
                      if (!until && occ < startDateObj) continue
                      // Only push occurrences up to a safe limit
                      if (tasks.length > 10000) break
                      tasks.push({
                        ...baseTask,
                        id: idCounter++,
                        dueDate: formatDate(occ),
                        dueTime: formatTime(occ),
                      })
                    }
                    // Advance one week
                    weekStart.setDate(weekStart.getDate() + 7)
                    if (until && weekStart > until) break
                    if (++loops > maxLoop) break
                  }
                } else {
                  // Fallback: create a single task and note recurrence in description
                  const d = startDateObj
                  tasks.push({
                    ...baseTask,
                    id: idCounter++,
                    dueDate: formatDate(d),
                    dueTime: formatTime(d),
                    description: `${description}\n\n(Recurrence: ${rruleRaw})`,
                  })
                }
              }
            } catch (err) {
              // skip malformed events but continue
              console.error('Failed to parse event', err)
            }
          }

          resolve(tasks)
        } catch (parseError) {
          console.error('Error parsing ICS file:', parseError)
          reject(new Error('The selected file is not a valid ICS file.'))
        }
      }
      reader.onerror = () => reject(new Error('An error occurred while reading the file.'))
      reader.readAsText(file)
    } catch (error) {
      reject(error)
    }
  })
}

// ===========================================================================
// TODO STORAGE (Simple todos, separate from calendar tasks)
// ===========================================================================

const TODOS_STORAGE_KEY = 'cortex-task-manager-todos'

/**
 * Loads simple TODO items from localStorage
 * @returns {Array} Array of TODO objects
 */
export function loadTodos() {
  try {
    const stored = localStorage.getItem(TODOS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  } catch (error) {
    console.error('Failed to load TODOs from storage:', error)
    return []
  }
}

/**
 * Saves simple TODO items to localStorage
 * @param {Array} todos - Array of TODO objects to save
 */
export function saveTodos(todos) {
  try {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos))
  } catch (error) {
    console.error('Failed to save TODOs to storage:', error)
    throw new Error('Unable to save TODOs. Your browser storage might be full.')
  }
}
