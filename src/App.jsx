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

import { useState, useEffect, useCallback } from "react";
import dailyTips from "./lib/dailyTips";
import { useDateRefresh } from "./hooks/useDateRefresh";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useOnboarding } from "./hooks/useOnboarding";
import { useIsMobile } from "./hooks/use-mobile";
import { RotateCcw } from "lucide-react"; // Icon library for a clean UI
import { Button } from "@/components/ui/button.jsx";
import CalendarView from "./components/CalendarView";
import TaskList from "./components/TaskList";
import SmartScheduler from "./components/SmartScheduler";
import StatisticsView from "./components/StatisticsView";
import NotificationSystem from "./components/NotificationSystem";
import SimpleTodoForm from "./components/SimpleTodoForm";
import TaskForm from "./components/TaskForm";
import OnboardingTour from "./components/OnboardingTour";
import MobileNav from "./components/MobileNav";
import { loadAppSetting, saveAppSetting } from "./utils/storage"; // Utility functions for data handling
import { isOverdue, pad } from "./utils/dateUtils";
import { useTasks } from "./contexts/TaskContext";
import { useTodos } from "./contexts/TodoContext";
import { useApp } from "./contexts/AppContext";
import "./App.css";
import Footer from "./components/Footer";
import ShortcutsModal from './components/ShortcutsModal';

// Imported Modular Components
import Header from "./components/layout/Header";
import NavigationTabs from "./components/layout/NavigationTabs";
import QuickTodosCard from "./components/sidebar/QuickTodosCard";
import OverviewCard from "./components/sidebar/OverviewCard";
import DailyTipCard from "./components/sidebar/DailyTipCard";

function App() {
  // Use the date refresh hook to handle midnight transitions
  const { getToday, now } = useDateRefresh();
  
  // =========================================================================
  // CONTEXT HOOKS - Centralized state management
  // =========================================================================
  const {
    tasks,
    addTask: contextAddTask,
    updateTask: contextUpdateTask,
    deleteTask: contextDeleteTask,
    toggleTaskComplete: contextToggleTaskComplete,
    toggleSubtaskComplete: contextToggleSubtaskComplete,
  } = useTasks();
  
  const {
    addTodo: contextAddTodo,
    updateTodo: contextUpdateTodo,
    deleteTodo: contextDeleteTodo,
    toggleTodoComplete: contextToggleTodoComplete,
  } = useTodos();
  
  const {
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

  // Detect mobile using the hook for reactive updates
  const isMobile = useIsMobile();
  
  // Onboarding tour hook
  const { resetTour } = useOnboarding();
  
  // =========================================================================
  // LOCAL UI STATE (Not part of contexts)
  // =========================================================================
  const [currentView, setCurrentView] = useState("calendar"); // Manages the active view ('calendar', 'tasks', 'scheduler').
  const [selectedDate, setSelectedDate] = useState(new Date()); // Tracks the currently selected date in the calendar.
  const [showTaskForm, setShowTaskForm] = useState(false); // Controls the visibility of the add/edit task modal.
  const [showTodoForm, setShowTodoForm] = useState(false); // Controls the visibility of the add/edit TODO modal.
  const [editingTask, setEditingTask] = useState(null); // Holds the task object being edited, or null for a new task.
  const [editingTodo, setEditingTodo] = useState(null); // Holds the TODO object being edited, or null for a new TODO.
  
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

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
    if (showShortcutsModal) {
      setShowShortcutsModal(false);
    }
  }, [showTaskForm, showTodoForm, showSettingsModal, showShortcutsModal, setShowSettingsModal]);

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
    '?': () => setShowShortcutsModal(true),
    'shift+?': () => setShowShortcutsModal(true),
  });

  // =========================================================================
  // TASK CRUD OPERATIONS (Wrapped with notifications)
  // =========================================================================

  /**
   * Adds a new task or a series of recurring tasks.
   * @param {object} taskData - The data for the new task from the form.
   */
  const handleAddTask = (taskData) => {
    // Delegate to context which handles recurrence and conflicts
    const result = contextAddTask(taskData);

    if (result.success) {
      setShowTaskForm(false);
      
      if (result.tasksAdded) {
        // Recurring tasks
        showNotification({
          type: "success",
          message: "Repeated tasks created",
          details: result.message,
        });
      } else {
        // Single task
        showNotification({
          type: "success",
          message: "Task created successfully",
          details: `"${result.task.title}" has been added to your list`,
        });
      }
    } else {
      // Error (e.g. conflict)
      showNotification({
        type: "error",
        message: "Failed to add task",
        details: result.message,
      });
    }
  };

  /**
   * Updates an existing task with new data.
   * @param {number} taskId - The ID of the task to update.
   * @param {object} updates - An object containing the properties to update.
   */
  const handleUpdateTask = (taskId, updates) => {
    const result = contextUpdateTask(taskId, updates);
    
    if (result.success) {
      setEditingTask(null);
      setShowTaskForm(false);
      showNotification({
        type: "success",
        message: "Task updated successfully",
      });
    } else {
       showNotification({
        type: "error",
        message: "Failed to update task",
        details: result.message,
      });
    }
  };

  /**
   * Deletes a task from the list.
   * @param {number} taskId - The ID of the task to delete.
   */
  const handleDeleteTask = (taskId) => {
    const task = contextDeleteTask(taskId);
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
  const handleToggleTaskComplete = (taskId) => {
    const { task, newStatus } = contextToggleTaskComplete(taskId);
    // Sound is played in context
    showNotification({
      type: "success",
      message: newStatus ? "Task completed!" : "Task reopened",
      details: `"${task?.title}" ${
        newStatus ? "marked as complete" : "marked as pending"
      }`,
    });
  };

  /**
   * Toggles the completion status of a subtask.
   * @param {number} taskId - The ID of the parent task.
   * @param {number} subtaskId - The ID of the subtask.
   */
  const handleToggleSubtaskComplete = (taskId, subtaskId) => {
    contextToggleSubtaskComplete(taskId, subtaskId);
    // Optional: Play a softer sound or partial success sound here.
    // For now, no notification to keep it lightweight.
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

  // =========================================================================
  // TODO HANDLERS (Simple TODOs)
  // =========================================================================

  const openTodoForm = (todo = null) => {
    setEditingTodo(todo);
    setShowTodoForm(true);
  };

  const closeTodoForm = () => {
    setShowTodoForm(false);
    setEditingTodo(null);
  };

  const handleAddTodo = (todoData) => {
    const newTodo = contextAddTodo(todoData);
    closeTodoForm();
    showNotification({
      type: "success",
      message: "TODO added successfully",
      details: `"${todoData.title}" has been added to your TODO list`,
    });
  };

  const handleUpdateTodo = (id, updates) => {
    contextUpdateTodo(id, updates);
    closeTodoForm();
    showNotification({
      type: "success",
      message: "TODO updated successfully",
      details: `Your TODO has been updated`,
    });
  };

  // ===========================================================================
  // RENDER METHOD
  // ===========================================================================

  return (
    <div className="min-h-screen serene-gradient">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* === HEADER SECTION === */}
        <Header 
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onAddTask={() => openTaskForm()}
        />

        {/* === NAVIGATION TABS & EXPAND BUTTON === */}
        <NavigationTabs currentView={currentView} setCurrentView={setCurrentView} />

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
                  onToggleComplete={handleToggleTaskComplete}
                  expanded={calendarExpanded && !isMobile}
                  onTaskDrop={(taskId, newDate) => {
                    const dateStr = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}`;
                    handleUpdateTask(taskId, { dueDate: dateStr });
                  }}
                />
              </div>
            )}

            {currentView === "tasks" && (
              <TaskList
                tasks={tasks}
                onTaskClick={openTaskForm}
                onToggleComplete={handleToggleTaskComplete}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtaskComplete}
              />
            )}

            {currentView === "scheduler" && (
              <SmartScheduler
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onShowNotification={showNotification}
                availableHours={availableHours}
              />
            )}

            {currentView === "statistics" && (
              <StatisticsView />
            )}
          </div>

          {/* === SIDEBAR === */}
          <div
            className={`sidebar-area ${calendarExpanded && !isMobile ? "sidebar-below flex-row flex-wrap gap-8 px-[0.5rem] py-[1rem]" : "space-y-6"}`}
            style={{
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <QuickTodosCard onOpenTodoForm={openTodoForm} />

            <OverviewCard />

            <DailyTipCard dailyTip={dailyTip} />
          </div>
        </div>

        {/* === MODALS & NOTIFICATIONS (Rendered at the top level) === */}
        {showTaskForm && (
          <TaskForm
            task={editingTask}
            initialDate={showTaskForm.initialDate}
            onSave={
              editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleAddTask
            }
            onCancel={closeTaskForm}
          />
        )}

        {/* SimpleTodoForm Modal */}
        {showTodoForm && (
          <SimpleTodoForm
            todo={editingTodo}
            onSave={
              editingTodo ? (data) => handleUpdateTodo(editingTodo.id, data) : handleAddTodo
            }
            onCancel={closeTodoForm}
          />
        )}

        <ShortcutsModal open={showShortcutsModal} onOpenChange={setShowShortcutsModal} />

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
                
                {/* Restart Tour Button */}
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      resetTour();
                      setShowSettingsModal(false);
                    }}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Onboarding Tour
                  </Button>
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
        
        {/* Onboarding Tour for first-time users */}
        <OnboardingTour />
        
        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <MobileNav
            currentView={currentView}
            setCurrentView={setCurrentView}
            onAddTask={() => openTaskForm()}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}
      </div>
      <Footer />
      {/* Add bottom padding on mobile for the nav bar */}
      {isMobile && <div className="h-20" />}
    </div>
  );
}

export default App;
