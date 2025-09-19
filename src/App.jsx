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

import { useState, useEffect } from "react";
import dailyTips from "./lib/dailyTips";
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Download,
  Upload,
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
import TaskForm from "./components/TaskForm";
import SmartScheduler from "./components/SmartScheduler";
import NotificationSystem from "./components/NotificationSystem";
import {
  loadTasks,
  saveTasks,
  exportTasks,
  importTasks,
} from "./utils/storage"; // Utility functions for data handling
import "./App.css";
import Footer from "./components/Footer";

function App() {
  function playCompleteSound() {
    const audio = new window.Audio('/complete.mp3');
    audio.play();
  }
  // User available hours state
  // Load available hours from localStorage or default
  const [availableHours, setAvailableHours] = useState(() => {
    const saved = localStorage.getItem("availableHours");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.start && parsed.end) return parsed;
      } catch (e) {
        // Ignore JSON parse errors
        console.error("Failed to parse available hours:", e);
    }
  }
    return { start: "13:00", end: "22:00" };
  });
  // Save available hours to localStorage whenever they change
  useEffect(() => {
    if (availableHours && availableHours.start && availableHours.end) {
      localStorage.setItem("availableHours", JSON.stringify(availableHours));
    }
  }, [availableHours]);
  // Daily tip logic: Save tip index in localStorage so it changes only once per day
  function getDailyTip() {
    const today = new Date().toISOString().split("T")[0];
    const tipData = JSON.parse(localStorage.getItem("dailyTipIndex")) || {};
    if (tipData.date === today && typeof tipData.index === "number") {
      return dailyTips[tipData.index];
    }
    // Pick a new random tip index for today
    const newIndex = Math.floor(Math.random() * dailyTips.length);
    localStorage.setItem("dailyTipIndex", JSON.stringify({ date: today, index: newIndex }));
    return dailyTips[newIndex];
  }
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  const [tasks, setTasks] = useState([]); // Holds the master list of all tasks.
  const [currentView, setCurrentView] = useState("calendar"); // Manages the active view ('calendar', 'tasks', 'scheduler').
  const [selectedDate, setSelectedDate] = useState(new Date()); // Tracks the currently selected date in the calendar.
  const [showTaskForm, setShowTaskForm] = useState(false); // Controls the visibility of the add/edit task modal.
  const [editingTask, setEditingTask] = useState(null); // Holds the task object being edited, or null for a new task.
  const [notifications, setNotifications] = useState([]); // Stores active user notifications.
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Manages the dark/light theme state, persisting the choice in localStorage.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    // If no theme is saved, default to the user's system preference.
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // Toggles the 'dark' class on the root HTML element based on `isDarkMode` state.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark"); // Persist theme choice.
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Toggles the app's color scheme.
  const toggleDarkMode = () => setIsDarkMode((d) => !d);

  // Loads tasks from storage on initial component mount.
  useEffect(() => {
    const savedTasks = loadTasks();
    setTasks(savedTasks);
  }, []);

  // Saves tasks to storage whenever the `tasks` array changes.
  useEffect(() => {
    // Avoid saving an empty array on the initial load.
    if (tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks]);

  // ===========================================================================
  // CORE CRUD & TASK OPERATIONS
  // ===========================================================================

  /**
   * Adds a new task or a series of recurring tasks.
   * @param {object} taskData - The data for the new task from the form.
   */
  // Helper to check for time conflicts
  function hasTimeConflict(newTask, existingTasks) {
    if (!newTask.dueDate || !newTask.dueTime || !newTask.estimatedDuration) return false;
    const newStart = new Date(`${newTask.dueDate}T${newTask.dueTime}`);
    const newEnd = new Date(newStart.getTime() + newTask.estimatedDuration * 60000);
    return existingTasks.some(task => {
      if (task.isCompleted || task.dueDate !== newTask.dueDate || !task.dueTime || !task.estimatedDuration) return false;
      const start = new Date(`${task.dueDate}T${task.dueTime}`);
      const end = new Date(start.getTime() + task.estimatedDuration * 60000);
      // Overlap: startA < endB && startB < endA
      return newStart < end && start < newEnd;
    });
  }

  const addTask = (taskData) => {
    // Check for time conflict for single and repeated tasks
    if (taskData.repeatUntil && taskData.repeatFrequency !== "none" && taskData.dueDate) {
      const repeatedTasks = [];
      // Parse the initial date and time
      let currentDate = new Date(`${taskData.dueDate}T${taskData.dueTime || "00:00"}`);
      const repeatUntilDate = new Date(`${taskData.repeatUntil}T${taskData.dueTime || "00:00"}`);
      let i = 0;
      let conflictFound = false;

      while (currentDate <= repeatUntilDate) {
        // Format date and time for each repeated task
        const pad = (n) => n.toString().padStart(2, '0');
        const candidateDate = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
        const candidateTime = `${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;
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
    const otherTasks = tasks.filter(task => task.id !== taskId);
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
  // NOTIFICATION SYSTEM
  // ===========================================================================

  /**
   * Displays a notification to the user.
   * @param {object} notification - The notification object with type, message, etc.
   */
  const showNotification = (notification) => {
    const id = Date.now();
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    // Notifications are automatically dismissed after 5 seconds.
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  };

  /**
   * Removes a notification from the screen.
   * @param {number} id - The ID of the notification to dismiss.
   */
  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ===========================================================================
  // DATA SELECTORS & HELPERS
  // ===========================================================================

  /**
   * Filters and returns tasks for a specific date.
   * @param {Date} date - The date to filter tasks by.
   * @returns {Array} An array of tasks for the given date.
   */
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => task.dueDate === dateStr);
  };

  /** Returns all tasks that are not completed. */
  const getPendingTasks = () => {
    return tasks.filter((task) => !task.isCompleted);
  };

  /** Returns all tasks that are marked as completed. */
  const getCompletedTasks = () => {
    return tasks.filter((task) => task.isCompleted);
  };

  /** Returns tasks that are past their due date and not yet completed. */
  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter((task) => {
      if (task.isCompleted || !task.dueDate) return false;
      if (!task.dueTime) {
        // No dueTime: overdue if the day is over
        const dayEnd = new Date(task.dueDate + 'T23:59:59');
        return now > dayEnd;
      }
      const start = new Date(task.dueDate + 'T' + task.dueTime);
      if (!task.estimatedDuration || isNaN(task.estimatedDuration) || task.estimatedDuration <= 0) {
        // No duration: overdue as soon as due time is met
        return now > start;
      } else {
        // Has duration: overdue after duration ends
        const end = new Date(start.getTime() + task.estimatedDuration * 60000);
        return now > end;
      }
    });
  };

  // ===========================================================================
  // DATA IMPORT/EXPORT HANDLERS
  // ===========================================================================

  /** Initiates the download of all tasks as a JSON file. */
  const handleExportTasks = () => {
    exportTasks(tasks);
    showNotification({
      type: "success",
      message: "Tasks exported successfully",
      details: "Your tasks have been downloaded as a JSON file",
    });
  };

  /**
   * Handles the file input change event to import tasks from a JSON file.
   * @param {Event} event - The file input change event.
   */
  const handleImportTasks = (event) => {
    const file = event.target.files[0];
    if (file) {
      importTasks(file)
        .then((importedTasks) => {
          setTasks(importedTasks);
          showNotification({
            type: "success",
            message: "Tasks imported successfully",
            details: `${importedTasks.length} tasks have been loaded`,
          });
        })
        .catch((error) => {
          showNotification({
            type: "error",
            message: "Import failed",
            details: error.message,
          });
        });
    }
    // Reset the file input to allow re-importing the same file if needed.
    event.target.value = "";
  };

  /**
   * Formats a time string (e.g., "14:30") into a 12-hour format (e.g., "2:30 PM").
   * @param {string} timeStr - The time string in HH:mm format.
   * @returns {string} The formatted time string.
   */
  function formatTime12(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    let hour = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

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
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
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
                    accept=".json"
                    onChange={handleImportTasks}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-tasks"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-300 hover:shadow-md active:scale-95 button relative-button"
                    asChild
                  >
                    <label htmlFor="import-tasks" className="cursor-pointer">
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

        {/* === NAVIGATION TABS === */}
        <div className="flex space-x-2 mb-8 navigation-container">
          <Button
            variant={currentView === "calendar" ? "default" : "outline"}
            onClick={() => setCurrentView("calendar")}
            className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
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
          <Button
            variant={currentView === "scheduler" ? "default" : "outline"}
            onClick={() => setCurrentView("scheduler")}
            className="flex items-center space-x-2 transition-all duration-300 hover:shadow-md active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Smart Scheduler</span>
          </Button>
        </div>

        {/* === MAIN CONTENT AREA === */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Primary View (Calendar, Task List, Scheduler) */}
          <div className="lg:col-span-3">
            {currentView === "calendar" && (
              <div className="calendar-container">
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  tasks={tasks}
                  onTaskClick={openTaskForm}
                  onToggleComplete={toggleTaskComplete}
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
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Today's Focus</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getTasksForDate(new Date()).length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">
                      No tasks for today
                    </p>
                    <p className="text-muted-foreground/70 text-xs mt-1">
                      Enjoy your free time!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getTasksForDate(new Date()).map((task) => (
                      <div
                        key={task.id}
                        className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30"
                        onClick={() => openTaskForm(task)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskComplete(task.id);
                              }}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                task.isCompleted
                                  ? "border-[var(--accent-2)] hover:border-[var(--accent-2)]"
                                  : "border-muted-foreground/30 hover:border-[var(--accent-2)]"
                              }`}
                              style={{ background: task.isCompleted ? 'var(--accent-2)' : 'transparent' }}
                            >
                              {task.isCompleted && (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  task.isCompleted
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "block",
                                  width: "100%",
                                  maxWidth: "100%"
                                }}
                                title={task.title}
                              >
                                {task.title}
                              </p>
                              {task.dueTime && (
                                <p className="text-xs text-muted-foreground">
                                  {formatTime12(task.dueTime)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs min-w-[60px] text-center"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
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

            <Card className="bg-accent/20 border-accent/30 backdrop-blur-sm rounded-xl shadow-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-accent-foreground">
                  <Sparkles className="h-5 w-5" />
                  <span>Daily Tip</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-accent-foreground/80 leading-relaxed">
                  {getDailyTip()}
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
            onSave={editingTask ? (data) => updateTask(editingTask.id, data) : addTask}
            onCancel={closeTaskForm}
          />
        )}

        {/* Settings Modal Placeholder */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 min-w-[320px] max-w-[90vw] relative">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
                <form
                  className="space-y-4"
                  onSubmit={e => {
                    e.preventDefault();
                    setShowSettingsModal(false);
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Available Start Time</label>
                    <input
                      type="time"
                      value={availableHours.start}
                      onChange={e => setAvailableHours(h => ({ ...h, start: e.target.value }))}
                      className="border rounded-md px-3 py-2 w-full dark:bg-gray-800"
                      min="00:00"
                      max="23:59"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Available End Time</label>
                    <input
                      type="time"
                      value={availableHours.end}
                      onChange={e => setAvailableHours(h => ({ ...h, end: e.target.value }))}
                      className="border rounded-md px-3 py-2 w-full dark:bg-gray-800"
                      min="00:00"
                      max="23:59"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" type="button" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground">Save</Button>
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

