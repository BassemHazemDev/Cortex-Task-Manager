/**
 * =============================================================================
 * REACT COMPONENT: App
 * =============================================================================
 *
 * This file serves as the root component for the Cortex Task Manager application.
 * It orchestrates the entire user interface and manages the application's state,
 * including tasks, user views, and notifications.
 *
 * Key functionalities include:
 * 1.  State Management: Utilizes React hooks (`useState`, `useEffect`) for all
 * dynamic data.
 * 2.  CRUD Operations: Handles the creation, reading, updating, and deletion
 * of tasks.
 * 3.  Theming: Manages light and dark mode switching and persists the user's
 * preference.
 * 4.  View Routing: Controls which main view (Calendar, Task List, Smart
 * Scheduler) is displayed.
 * 5.  Data Persistence: Saves tasks to and loads them from local storage.
 * 6.  Import/Export: Allows users to back up and restore their task data.
 *
 * =============================================================================
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import dailyTips from "./lib/dailyTips";
import { useDateRefresh } from "./hooks/useDateRefresh";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Download,
  Upload,
  Expand,
  ChevronsDownUp,
  Trash2,
} from "lucide-react"; // Icon library for a clean UI
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import CalendarView from "./components/CalendarView";
import TaskList from "./components/TaskList";
import SmartScheduler from "./components/SmartScheduler";
import NotificationSystem from "./components/NotificationSystem";
import SimpleTodoForm from "./components/SimpleTodoForm";
import TaskForm from "./components/TaskForm";
import {
  exportAllData,
  importAllData,
  importICS,
  loadAppSetting,
  saveAppSetting,
} from "./utils/storage"; // Utility functions for data handling
import { playCompleteSound } from "./utils/audioUtils";
import { isOverdue } from "./utils/dateUtils";
import { useTasks } from "./contexts/TaskContext";
import { useTodos } from "./contexts/TodoContext";
import { useApp } from "./contexts/AppContext";
import "./App.css";
import Footer from "./components/Footer";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTodoItem } from './components/SortableTodoItem';

function App() {
  // Use the date refresh hook to handle midnight transitions
  const { getToday, now } = useDateRefresh();
  
  // =========================================================================
  // CONTEXT HOOKS - Centralized state management
  // =========================================================================
  const {
    tasks,
    setTasks,
    addTask: contextAddTask,
    updateTask: contextUpdateTask,
    deleteTask: contextDeleteTask,
    toggleTaskComplete: contextToggleTaskComplete,
    hasTimeConflict,
    getPendingTasks,
    getCompletedTasks,
  } = useTasks();
  
  const {
    todos,
    setTodos,
    addTodo: contextAddTodo,
    updateTodo: contextUpdateTodo,
    deleteTodo: contextDeleteTodo,
    toggleTodoComplete: contextToggleTodoComplete,
    reorderTodos,
  } = useTodos();
  
  const {
    isDarkMode,
    toggleDarkMode,
    notifications,
    showNotification,
    dismissNotification,
    availableHours,
    setAvailableHours,
    showSettingsModal,
    setShowSettingsModal,
    calendarExpanded,
    setCalendarExpanded,
  } = useApp();

  // Detect mobile (simple check)
  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  
  // =========================================================================
  // LOCAL UI STATE (Not part of contexts)
  // =========================================================================
  const [currentView, setCurrentView] = useState("calendar"); // Manages the active view ('calendar', 'tasks', 'scheduler').
  const [selectedDate, setSelectedDate] = useState(new Date()); // Tracks the currently selected date in the calendar.
  const [showTaskForm, setShowTaskForm] = useState(false); // Controls the visibility of the add/edit task modal.
  const [showTodoForm, setShowTodoForm] = useState(false); // Controls the visibility of the add/edit TODO modal.
  const [editingTask, setEditingTask] = useState(null); // Holds the task object being edited, or null for a new task.
  const [editingTodo, setEditingTodo] = useState(null); // Holds the TODO object being edited, or null for a new TODO.
  
  // State for completed TODOs collapse and pagination
  const [showCompletedTodos, setShowCompletedTodos] = useState(false);
  const [completedTodosPage, setCompletedTodosPage] = useState(1);
  const completedTodosPerPage = 5;

  // =========================================================================
  // MEMOIZED VALUES
  // =========================================================================
  
  // State for daily tip
  const [dailyTip, setDailyTip] = useState(dailyTips[0]);

  // Load/Update daily tip on day change or mount
  useEffect(() => {
    const loadDailyTip = async () => {
      const today = getToday();
      try {
        const tipData = await loadAppSetting("dailyTipIndex", {});
        
        if (tipData.date === today && typeof tipData.index === "number") {
          setDailyTip(dailyTips[tipData.index] || dailyTips[0]);
        } else {
          // New day, new tip
          const newIndex = Math.floor(Math.random() * dailyTips.length);
          const newTipData = { date: today, index: newIndex };
          await saveAppSetting("dailyTipIndex", newTipData);
          setDailyTip(dailyTips[newIndex]);
        }
      } catch (error) {
        console.error("Error loading daily tip:", error);
      }
    };
    loadDailyTip();
  }, [getToday]);

  // =========================================================================
  // KEYBOARD SHORTCUTS
  // =========================================================================
  
  // Close any open modal
  const closeAllModals = useCallback(() => {
    if (showTaskForm) {
      setShowTaskForm(false);
      setEditingTask(null);
    }
    if (showTodoForm) {
      setShowTodoForm(false);
      setEditingTodo(null);
    }
    if (showSettingsModal) {
      setShowSettingsModal(false);
    }
  }, [showTaskForm, showTodoForm, showSettingsModal, setShowSettingsModal]);

  // Register keyboard shortcuts (using Alt+ to avoid browser conflicts)
  useKeyboardShortcuts({
    'alt+n': () => {
      setEditingTask(null);
      setShowTaskForm(true);
    },
    'alt+t': () => {
      setEditingTodo(null);
      setShowTodoForm(true);
    },
    'escape': closeAllModals,
    'alt+1': () => setCurrentView('calendar'),
    'alt+2': () => setCurrentView('tasks'),
    'alt+3': () => setCurrentView('scheduler'),
    'alt+d': toggleDarkMode,
  });

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // console.log('Drag End:', { active: active.id, over: over?.id });

    if (active.id !== over?.id) {
      // Ensure we pass the original ID types (numbers) to reorderTodos if the state uses numbers
      // But dnd-kit uses strings often. Let's see if we need conversion back.
      // If our state IDs are numbers, we should keep them as numbers for the context updates.
      // However, SortableContext logic below converts them to strings for dnd-kit.
      
      // Let's assume reorderTodos expects the IDs as they are in the 'todos' state (likely numbers).
      // We explicitly convert to string for dnd-kit, so active.id might be a string now? 
      // Actually `useSortable` id prop type determines `active.id` type.
      
      // We will update SortableTodoItem to use String(id). So active.id will be string.
      // We need to find the original numeric IDs to pass to reorderTodos.
      const activeId = Number(active.id);
      const overId = Number(over.id);
      
      reorderTodos(activeId, overId);
    }
  };

  // =========================================================================
  // TASK CRUD OPERATIONS (Wrapped with notifications)
  // =========================================================================

  /**
   * Adds a new task or a series of recurring tasks.
   * @param {object} taskData - The data for the new task from the form.
   */
  const addTask = (taskData) => {
    // Check for time conflict for single and repeated tasks
    if (
      taskData.repeatUntil &&
      taskData.repeatFrequency !== "none" &&
      taskData.dueDate
    ) {
      const repeatedTasks = [];
      // Parse the initial date and time
      let currentDate = new Date(
        `${taskData.dueDate}T${taskData.dueTime || "00:00"}`
      );
      const repeatUntilDate = new Date(
        `${taskData.repeatUntil}T${taskData.dueTime || "00:00"}`
      );
      let i = 0;
      let conflictFound = false;

      while (currentDate <= repeatUntilDate) {
        // Format date and time for each repeated task
        const pad = (n) => n.toString().padStart(2, "0");
        const candidateDate = `${currentDate.getFullYear()}-${pad(
          currentDate.getMonth() + 1
        )}-${pad(currentDate.getDate())}`;
        const candidateTime = `${pad(currentDate.getHours())}:${pad(
          currentDate.getMinutes()
        )}`;
        const candidate = {
          ...taskData,
          dueDate: candidateDate,
          dueTime: candidateTime,
        };
        if (hasTimeConflict(candidate, tasks)) {
          conflictFound = true;
          break;
        }
        repeatedTasks.push({
          ...candidate,
          id: Date.now() + i,
          isCompleted: false,
          assignedSlot: null,
        });
        // Increment the date based on the chosen frequency, preserving the time
        switch (taskData.repeatFrequency) {
          case "daily":
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case "weekly":
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case "yearly":
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            break;
        }
        i++;
      }
      if (conflictFound) {
        showNotification({
          type: "error",
          message: "Time conflict detected",
          details: `One or more repeated tasks overlap with existing tasks. Please adjust the time or duration.`,
        });
        return;
      }
      setTasks([...tasks, ...repeatedTasks]);
      setShowTaskForm(false);
      showNotification({
        type: "success",
        message: "Repeated tasks created",
        details: `${repeatedTasks.length} tasks have been added (${taskData.repeatFrequency} until ${taskData.repeatUntil})`,
      });
    } else {
      // Logic for adding a single, non-recurring task.
      if (hasTimeConflict(taskData, tasks)) {
        showNotification({
          type: "error",
          message: "Time conflict detected",
          details: `This task overlaps with an existing task. Please adjust the time or duration.`,
        });
        return;
      }
      const newTask = {
        ...taskData,
        id: Date.now(),
        isCompleted: false,
        assignedSlot: null,
      };
      setTasks([...tasks, newTask]);
      setShowTaskForm(false);
      showNotification({
        type: "success",
        message: "Task created successfully",
        details: `"${taskData.title}" has been added to your list`,
      });
    }
  };

  /**
   * Updates an existing task with new data.
   * @param {number} taskId - The ID of the task to update.
   * @param {object} updates - An object containing the properties to update.
   */
  const updateTask = (taskId, updates) => {
    // Exclude the current task from conflict check
    const otherTasks = tasks.filter((task) => task.id !== taskId);
    if (hasTimeConflict(updates, otherTasks)) {
      showNotification({
        type: "error",
        message: "Time conflict detected",
        details: `This task overlaps with an existing task. Please adjust the time or duration.`,
      });
      return;
    }
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
    setEditingTask(null);
    setShowTaskForm(false);

    showNotification({
      type: "success",
      message: "Task updated successfully",
    });
  };

  /**
   * Deletes a task from the list.
   * @param {number} taskId - The ID of the task to delete.
   */
  const deleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks(tasks.filter((task) => task.id !== taskId));

    showNotification({
      type: "info",
      message: "Task deleted",
      details: `"${task?.title}" has been removed`,
    });
  };

  /**
   * Toggles the completion status of a task.
   * @param {number} taskId - The ID of the task to toggle.
   */
  const toggleTaskComplete = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const newStatus = !task.isCompleted;

    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: newStatus } : task
      )
    );

    if (newStatus) playCompleteSound();

    showNotification({
      type: "success",
      message: newStatus ? "Task completed!" : "Task reopened",
      details: `"${task?.title}" ${
        newStatus ? "marked as complete" : "marked as pending"
      }`,
    });
  };

  // ===========================================================================
  // UI & FORM HANDLING
  // ===========================================================================

  /**
   * Opens the task form, either for creating a new task or editing an existing one.
   * @param {object|Date|null} taskOrDate - The task object to edit, a Date to pre-fill, or null for a new task.
   * @param {object} options - Additional options, like specifying a new task.
   */
  const openTaskForm = (taskOrDate = null, options = {}) => {
    // Handle creating a new task from a date click in the calendar.
    if (options.isNew && taskOrDate instanceof Date) {
      const pad = (n) => n.toString().padStart(2, "0");
      const dateStr = `${taskOrDate.getFullYear()}-${pad(
        taskOrDate.getMonth() + 1
      )}-${pad(taskOrDate.getDate())}`;
      setEditingTask(null);
      setShowTaskForm({
        initialDate: dateStr,
      });
      return;
    }
    // Handle creating a new task from a pre-selected date.
    if (taskOrDate instanceof Date) {
      const pad = (n) => n.toString().padStart(2, "0");
      const dateStr = `${taskOrDate.getFullYear()}-${pad(
        taskOrDate.getMonth() + 1
      )}-${pad(taskOrDate.getDate())}`;
      setEditingTask({
        title: "",
        description: "",
        dueDate: dateStr,
        dueTime: "",
        priority: "medium",
        estimatedDuration: 60,
        type: "task",
        repeatUntil: "",
        repeatFrequency: "none",
      });
      setShowTaskForm(true);
    } else {
      // Handle editing an existing task or creating a blank new one.
      setEditingTask(taskOrDate); // Can be a full task object or null.
      setShowTaskForm(true);
    }
  };

  /** Closes the task form and resets the editing state. */
  const closeTaskForm = () => {
    setEditingTask(null);
    setShowTaskForm(false);
  };

  // ===========================================================================
  // DATA SELECTORS & HELPERS
  // ===========================================================================

  /** Returns tasks that are past their due date and not yet completed. */
  const getOverdueTasks = () => {
    return tasks.filter((task) => isOverdue(task, now));
  };

  // ===========================================================================
  // TODO HANDLERS (Simple TODOs separate from calendar tasks)
  // ===========================================================================

  /**
   * Opens the TODO form for adding or editing a TODO.
   * @param {object} todo - The TODO to edit (null for new TODO).
   */
  const openTodoForm = (todo = null) => {
    setEditingTodo(todo);
    setShowTodoForm(true);
  };

  /**
   * Closes the TODO form.
   */
  const closeTodoForm = () => {
    setShowTodoForm(false);
    setEditingTodo(null);
  };

  /**
   * Adds a new TODO.
   * @param {object} todoData - The data for the new TODO.
   */
  const addTodo = (todoData) => {
    const newTodo = {
      id: Date.now(),
      ...todoData,
      isCompleted: false,
    };
    setTodos((prev) => [...prev, newTodo]);
    closeTodoForm();
    showNotification({
      type: "success",
      message: "TODO added successfully",
      details: `"${todoData.title}" has been added to your TODO list`,
    });
  };

  /**
   * Updates an existing TODO.
   * @param {number} id - The ID of the TODO to update.
   * @param {object} updates - The updated TODO data.
   */
  const updateTodo = (id, updates) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    );
    closeTodoForm();
    showNotification({
      type: "success",
      message: "TODO updated successfully",
      details: `Your TODO has been updated`,
    });
  };

  /**
   * Deletes a TODO by ID.
   * @param {number} id - The ID of the TODO to delete.
   */
  const deleteTodo = (id) => {
    const todo = todos.find((t) => t.id === id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    showNotification({
      type: "success",
      message: "TODO deleted",
      details: todo ? `"${todo.title}" has been removed` : "TODO has been removed",
    });
  };

  /**
   * Toggles the completion status of a TODO.
   * @param {number} id - The ID of the TODO to toggle.
   */
  const toggleTodoComplete = (id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
    const todo = todos.find((t) => t.id === id);
    if (todo && !todo.isCompleted) {
      playCompleteSound();
      showNotification({
        type: "success",
        message: "TODO completed! 🎉",
        details: `Great job completing "${todo.title}"!`,
      });
    }
  };

  // ===========================================================================
  // DATA IMPORT/EXPORT HANDLERS
  // ===========================================================================

  /** Initiates the download of all tasks and TODOs as a JSON file. */
  const handleExportTasks = async () => {
    try {
      await exportAllData();
      showNotification({
        type: "success",
        message: "Tasks & TODOs exported successfully",
        details: "Your data has been downloaded as a JSON file",
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Export failed',
        details: 'Failed to export data from database.'
      });
    }
  };

  // unified import handler is attached directly to the input element

  /**
   * Formats a time string (e.g., "14:30") into a 12-hour format (e.g., "2:30 PM").
   * @param {string} timeStr - The time string in HH:mm format.
   * @returns {string} The formatted time string.
   */
 

  // ===========================================================================
  // RENDER METHOD
  // ===========================================================================

  return (
    <div className="min-h-screen serene-gradient">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* === HEADER SECTION === */}
        <header className="mb-8 header">
          <div className="flex items-center justify-between w-full header-content">
            <div className="flex items-center space-x-4 header-logo">
              <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
                <img
                  src={isDarkMode ? "/cortex2.png" : "/cortex1.png"}
                  alt="Cortex Logo"
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Cortex Task Manager
                </h1>
                <p className="text-muted-foreground text-lg">
                  Stay organized, stay calm ✨
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 header-controls">
              {/* Settings and Dark Mode */}
              <div className="flex items-center space-x-2 header-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Settings"
                  onClick={() => setShowSettingsModal(true)}
                  className="transition-all duration-300 hover:shadow-md active:scale-95 button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    />
                  </svg>
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={
                    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                  onClick={toggleDarkMode}
                  className="transition-all duration-300 hover:shadow-md active:scale-95 button"
                >
                  {isDarkMode ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
                      />
                    </svg>
                  )}
                  {isDarkMode ? "Light" : "Dark"} Mode
                </Button>
              </div>

              {/* Export/Import group */}
              <div className="flex items-center space-x-2 header-buttons">
                <Button
                  onClick={handleExportTasks}
                  variant="outline"
                  size="sm"
                  className="transition-all duration-300 hover:shadow-md active:scale-95 button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json,.ics"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const maxSize = 5 * 1024 * 1024 // 5MB
                      if (file.size > maxSize) {
                        showNotification({ type: 'error', message: 'File too large', details: 'Please select a file smaller than 5MB.' })
                        e.target.value = ''
                        return
                      }
                      const name = file.name.toLowerCase()
                      if (name.endsWith('.json')) {
                        importAllData(file)
                          .then(({ tasks: importedTasks, todos: importedTodos }) => {
                            setTasks(importedTasks)
                            setTodos(importedTodos)
                            showNotification({ type: 'success', message: 'Data imported successfully', details: `${importedTasks.length} tasks and ${importedTodos.length} TODOs loaded from ${file.name}` })
                          })
                          .catch((err) => {
                            showNotification({ type: 'error', message: 'Import failed', details: err.message })
                          })
                      } else if (name.endsWith('.ics')) {
                        importICS(file)
                          .then(({ tasks: importedTasks, stats }) => {
                            const existingKeys = new Set(tasks.map(t => `${t.title}__${t.dueDate}__${t.dueTime}`))
                            const toAdd = importedTasks.filter(it => !existingKeys.has(`${it.title}__${it.dueDate}__${it.dueTime}`)).map(it => ({ ...it, id: Date.now() + Math.floor(Math.random()*10000) }))
                            if (toAdd.length > 0) setTasks(prev => [...prev, ...toAdd])
                            
                            const details = stats.failed > 0 
                              ? `${toAdd.length} events added. ${stats.failed} failed/skipped.`
                              : `${toAdd.length} events added as tasks from ${file.name}`;

                            showNotification({ type: 'success', message: 'Calendar imported', details })
                          })
                          .catch((err) => {
                            showNotification({ type: 'error', message: 'ICS import failed', details: err.message })
                          })
                      } else {
                        showNotification({ type: 'error', message: 'Unsupported file type', details: 'Please select a .json or .ics file.' })
                      }
                      e.target.value = ''
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-file"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-300 hover:shadow-md active:scale-95 button relative-button"
                    asChild
                  >
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Download className="h-4 w-4 mr-2" />
                      Import
                    </label>
                  </Button>
                </div>
              </div>
              {/* Add Task button */}
              <Button
                onClick={() => openTaskForm()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-md active:scale-95 button"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </header>

  {/* === NAVIGATION TABS & EXPAND BUTTON === */}
  <div className="flex space-x-2 mb-8 navigation-container items-center relative">
          <div className="flex space-x-2 navigation-inner">
            <Button
              variant={currentView === "calendar" ? "default" : "outline"}
              onClick={() => setCurrentView("calendar")}
              className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95 calendar-button"
            >
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </Button>
            <Button
              variant={currentView === "tasks" ? "default" : "outline"}
              onClick={() => setCurrentView("tasks")}
              className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Tasks</span>
            </Button>
          </div>
          <Button
            variant={currentView === "scheduler" ? "default" : "outline"}
            onClick={() => setCurrentView("scheduler")}
            className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Smart Scheduler</span>
          </Button>
          {/* Expand/Collapse Calendar Button (Desktop only, right aligned, icon with hover text) */}
          {!isMobile && currentView === "calendar" && (
            <div style={{ position: "absolute", right: 0, top: 0, height: "100%", display: "flex", alignItems: "center" }}>
              <Button
                variant="outline"
                size="icon"
                className="calendar-expand-btn group transition-all duration-300"
                onClick={() => setCalendarExpanded((v) => !v)}
                style={{ position: "relative", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label={calendarExpanded ? "Collapse Calendar" : "Expand Calendar"}
              >
                {calendarExpanded ? (
                  <ChevronsDownUp className="h-5 w-5" />
                ) : (
                  <Expand className="h-5 w-5" />
                )}
                <span
                  className="calendar-expand-text group-hover:opacity-100 opacity-0 absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-card px-2 py-1 rounded shadow text-xs font-medium transition-opacity duration-300"
                  style={{ whiteSpace: "nowrap", pointerEvents: "none" }}
                >
                  {calendarExpanded ? "Collapse Calendar" : "Expand Calendar"}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* === MAIN CONTENT AREA === */}
        <div
          className={`main-content-area grid gap-8 ${
            calendarExpanded && !isMobile
              ? "grid-cols-1 calendar-expanded"
              : "grid-cols-1 lg:grid-cols-4"
          }`}
        >
          {/* Primary View (Calendar, Task List, Scheduler) */}
          <div
            className={
              calendarExpanded && !isMobile
                ? "calendar-expanded-area"
                : "lg:col-span-3"
            }
            style={{
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {currentView === "calendar" && (
              <div
                className={`calendar-container ${
                  calendarExpanded && !isMobile ? "expanded" : ""
                }`}
                style={{
                  transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  tasks={tasks}
                  onTaskClick={openTaskForm}
                  onCreateDate={(date) => openTaskForm(date, { isNew: true })}
                  onToggleComplete={toggleTaskComplete}
                  expanded={calendarExpanded && !isMobile}
                  onTaskDrop={(taskId, newDate) => {
                    // Find the task
                    const task = tasks.find((t) => t.id === taskId);
                    if (!task) return;
                    // Format new date string
                    const pad = (n) => n.toString().padStart(2, "0");
                    const dateStr = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`;
                    // If date is unchanged, do nothing
                    if (task.dueDate === dateStr) return;
                    // Prepare updates
                    const updates = { ...task, dueDate: dateStr };
                    // Exclude current task for conflict check
                    const otherTasks = tasks.filter((t) => t.id !== taskId);
                    if (hasTimeConflict(updates, otherTasks)) {
                      showNotification({
                        type: "error",
                        message: "Time conflict detected",
                        details: `This task overlaps with an existing task. Please adjust the time or duration.`,
                      });
                      // No update, revert
                      return;
                    }
                    // Update task
                    setTasks(
                      tasks.map((t) => (t.id === taskId ? { ...t, dueDate: dateStr } : t))
                    );
                    showNotification({
                      type: "success",
                      message: "Task moved successfully",
                      details: `Task "${task.title}" moved to ${dateStr}`,
                    });
                  }}
                />
              </div>
            )}

            {currentView === "tasks" && (
              <TaskList
                tasks={tasks}
                onTaskClick={openTaskForm}
                onToggleComplete={toggleTaskComplete}
                onDeleteTask={deleteTask}
              />
            )}

            {currentView === "scheduler" && (
              <SmartScheduler
                tasks={tasks}
                onUpdateTask={updateTask}
                onShowNotification={showNotification}
                availableHours={availableHours}
              />
            )}
          </div>

          {/* === SIDEBAR === */}
          <div
            className={`sidebar-area ${calendarExpanded && !isMobile ? "sidebar-below flex-row flex-wrap gap-8 px-[0.5rem] py-[1rem]" : "space-y-6"}`}
            style={{
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <Card className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300 sidebar-focus`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Quick TODOs</span>
                  </div>
                  <Button
                    onClick={() => openTodoForm()}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-md active:scale-95"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todos.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">
                      No TODOs yet
                    </p>
                    <p className="text-muted-foreground/70 text-xs mt-1">
                      Add quick tasks to stay organized!
                    </p>
                  </div>
                ) : (
                  <>
                    <DndContext 
                      sensors={sensors} 
                      collisionDetection={closestCenter} 
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={todos.filter(todo => !todo.isCompleted).map(t => String(t.id))}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {todos.filter(todo => !todo.isCompleted).map((todo) => (
                            <SortableTodoItem
                              key={todo.id}
                              todo={todo}
                              toggleTodoComplete={toggleTodoComplete}
                              openTodoForm={openTodoForm}
                              deleteTodo={deleteTodo}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  
                  {/* Collapsible completed TODOs section */}
                  {(() => {
                    const completedTodos = todos.filter(t => t.isCompleted);
                    const totalCompletedPages = Math.ceil(completedTodos.length / completedTodosPerPage);
                    const paginatedCompletedTodos = completedTodos.slice(
                      (completedTodosPage - 1) * completedTodosPerPage,
                      completedTodosPage * completedTodosPerPage
                    );
                    
                    if (completedTodos.length === 0) return null;
                    
                    return (
                      <div className="mt-4">
                        <button
                          className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30 flex items-center justify-between"
                          onClick={() => setShowCompletedTodos(s => !s)}
                          aria-expanded={showCompletedTodos}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 border-[var(--accent-2)]`}
                              style={{ background: "var(--accent-2)" }}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium">Completed TODOs</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="default" className="text-xs min-w-[40px] text-center">
                              {completedTodos.length}
                            </Badge>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-5 w-5 transition-transform duration-300 ${showCompletedTodos ? 'rotate-180' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        
                        {showCompletedTodos && (
                          <div className="mt-3 space-y-2">
                            {paginatedCompletedTodos.map(todo => (
                              <div 
                                key={todo.id} 
                                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30"
                              >
                                <div className="flex items-center justify-between w-full gap-2">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTodoComplete(todo.id);
                                      }}
                                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 border-[var(--accent-2)] hover:border-[var(--accent-2)] hover:scale-110 cursor-pointer"
                                      style={{ background: "var(--accent-2)" }}
                                      title="Click to mark as incomplete"
                                    >
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    </button>
                                    <div 
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => openTodoForm(todo)}
                                    >
                                      <p
                                        className="text-sm font-medium line-through text-muted-foreground"
                                        style={{
                                          wordBreak: 'break-word',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical'
                                        }}
                                        title={todo.title}
                                      >
                                        {todo.title}
                                      </p>
                                      {todo.description && (
                                        <p 
                                          className="text-xs text-muted-foreground mt-1"
                                          style={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                          title={todo.description}
                                        >
                                          {todo.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge
                                      variant={
                                        todo.priority === "high"
                                          ? "destructive"
                                          : todo.priority === "medium"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs min-w-[60px] text-center opacity-60"
                                    >
                                      {todo.priority}
                                    </Badge>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTodo(todo.id);
                                      }}
                                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                      aria-label="Delete TODO"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {totalCompletedPages > 1 && (
                              <div className="flex justify-center items-center gap-3 mt-4 pt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="transition-all duration-300 hover:shadow-md active:scale-95"
                                  onClick={() => setCompletedTodosPage(p => Math.max(1, p - 1))}
                                  disabled={completedTodosPage === 1}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                  Prev
                                </Button>
                                <span className="text-xs font-medium px-3 py-1 rounded bg-muted text-muted-foreground">
                                  {completedTodosPage} / {totalCompletedPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="transition-all duration-300 hover:shadow-md active:scale-95"
                                  onClick={() => setCompletedTodosPage(p => Math.min(totalCompletedPages, p + 1))}
                                  disabled={completedTodosPage === totalCompletedPages}
                                >
                                  Next
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300 sidebar-overview`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span>Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Pending Tasks
                    </span>
                    <Badge variant="outline" className="font-semibold">
                      {getPendingTasks().length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Completed Tasks
                    </span>
                    <Badge variant="outline" className="font-semibold">
                      {getCompletedTasks().length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Overdue Tasks
                    </span>
                    <Badge
                      variant={
                        getOverdueTasks().length > 0 ? "destructive" : "outline"
                      }
                      className="font-semibold"
                    >
                      {getOverdueTasks().length}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Tasks</span>
                      <Badge variant="default" className="font-semibold">
                        {tasks.length}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-accent/20 border-accent/30 backdrop-blur-sm rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300 sidebar-tip`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-accent-foreground">
                  <Sparkles className="h-5 w-5" />
                  <span>Daily Tip</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-accent-foreground/80 leading-relaxed">
                  {dailyTip}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* === MODALS & NOTIFICATIONS (Rendered at the top level) === */}
        {showTaskForm && (
          <TaskForm
            task={editingTask}
            initialDate={showTaskForm.initialDate}
            onSave={
              editingTask ? (data) => updateTask(editingTask.id, data) : addTask
            }
            onCancel={closeTaskForm}
          />
        )}

        {/* SimpleTodoForm Modal */}
        {showTodoForm && (
          <SimpleTodoForm
            todo={editingTodo}
            onSave={
              editingTodo ? (data) => updateTodo(editingTodo.id, data) : addTodo
            }
            onCancel={closeTodoForm}
          />
        )}

        {/* Settings Modal Placeholder */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 min-w-[320px] max-w-[90vw] relative">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowSettingsModal(false);
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Available Start Time
                  </label>
                  <input
                    type="time"
                    value={availableHours.start}
                    onChange={(e) =>
                      setAvailableHours((h) => ({
                        ...h,
                        start: e.target.value,
                      }))
                    }
                    className="border rounded-md px-3 py-2 w-full dark:bg-gray-800"
                    min="00:00"
                    max="23:59"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Available End Time
                  </label>
                  <input
                    type="time"
                    value={availableHours.end}
                    onChange={(e) =>
                      setAvailableHours((h) => ({ ...h, end: e.target.value }))
                    }
                    className="border rounded-md px-3 py-2 w-full dark:bg-gray-800"
                    min="00:00"
                    max="23:59"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <NotificationSystem
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </div>
      <Footer />
    </div>
  );
}

export default App;
