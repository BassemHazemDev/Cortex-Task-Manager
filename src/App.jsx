/**
 * =============================================================================
 * REACT COMPONENT: App
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import dailyTips from "./lib/dailyTips";
import { useDateRefresh } from "./hooks/useDateRefresh";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useOnboarding } from "./hooks/useOnboarding";
import { useIsMobile } from "./hooks/use-mobile";
import { RotateCcw } from "lucide-react"; 
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
import { loadAppSetting, saveAppSetting } from "./utils/storage";
import { isOverdue, pad } from "./utils/dateUtils";
import { useTasks } from "./contexts/TaskContext";
import { useTodos } from "./contexts/TodoContext";
import { useApp } from "./contexts/AppContext";
import "./App.css";
import Footer from "./components/Footer";
import ShortcutsModal from './components/ShortcutsModal';
import DetailModal from './components/modals/DetailModal';

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
  // CONTEXT HOOKS
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

  const isMobile = useIsMobile();
  const { resetTour } = useOnboarding();
  
  // =========================================================================
  // LOCAL UI STATE
  // =========================================================================
  const [currentView, setCurrentView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal visibility states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  
  // Active item states
  const [editingTask, setEditingTask] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  
  // Viewing state
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null); // 'task' | 'todo'
  
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // =========================================================================
  // MEMOIZED VALUES
  // =========================================================================
  const [dailyTip, setDailyTip] = useState(dailyTips[0]);

  useEffect(() => {
    const loadDailyTip = async () => {
      const today = getToday();
      try {
        const tipData = await loadAppSetting("dailyTipIndex", {});
        
        if (tipData.date === today && typeof tipData.index === "number") {
          setDailyTip(dailyTips[tipData.index] || dailyTips[0]);
        } else {
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
    if (viewingItem) {
        setViewingItem(null);
        setViewingType(null);
    }
  }, [showTaskForm, showTodoForm, showSettingsModal, showShortcutsModal, setShowSettingsModal, viewingItem]);

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
  // TASK CRUD OPERATIONS
  // =========================================================================
  const handleAddTask = (taskData) => {
    const result = contextAddTask(taskData);

    if (result.success) {
      setShowTaskForm(false);
      if (result.tasksAdded) {
        showNotification({
          type: "success",
          message: "Repeated tasks created",
          details: result.message,
        });
      } else {
        showNotification({
          type: "success",
          message: "Task created successfully",
          details: `"${result.task.title}" has been added to your list`,
        });
      }
    } else {
      showNotification({
        type: "error",
        message: "Failed to add task",
        details: result.message,
      });
    }
  };

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

  const handleDeleteTask = (taskId) => {
    const task = contextDeleteTask(taskId);
    showNotification({
      type: "info",
      message: "Task deleted",
      details: `"${task?.title}" has been removed`,
    });
  };

  const handleToggleTaskComplete = (taskId) => {
    const { task, newStatus } = contextToggleTaskComplete(taskId);
    showNotification({
      type: "success",
      message: newStatus ? "Task completed!" : "Task reopened",
      details: `"${task?.title}" ${
        newStatus ? "marked as complete" : "marked as pending"
      }`,
    });
  };

  const handleToggleSubtaskComplete = (taskId, subtaskId) => {
    contextToggleSubtaskComplete(taskId, subtaskId);
  };

  // ===========================================================================
  // UI & FORM HANDLING
  // ===========================================================================
  const openTaskForm = (taskOrDate = null, options = {}) => {
    // 1. New Task
    if (options.isNew || !taskOrDate || taskOrDate instanceof Date) {
        let initialDateStr = "";
        if (taskOrDate instanceof Date) {
             initialDateStr = `${taskOrDate.getFullYear()}-${pad(taskOrDate.getMonth() + 1)}-${pad(taskOrDate.getDate())}`;
        }
        setEditingTask(null);
        setShowTaskForm({ initialDate: initialDateStr });
        return;
    }

    // 2. View Existing Task
    setViewingItem(taskOrDate);
    setViewingType('task');
  };
  
  const handleEditItem = (item) => {
      setViewingItem(null);
      setViewingType(null);

      if (viewingType === 'task' || (item.dueDate !== undefined)) { 
          setEditingTask(item);
          setShowTaskForm(true);
      } else {
          setEditingTodo(item);
          setShowTodoForm(true);
      }
  };

  const closeTaskForm = () => {
    setEditingTask(null);
    setShowTaskForm(false);
  };
  
  const closeDetailModal = () => {
      setViewingItem(null);
      setViewingType(null);
  }
  
  // Directly open edit form (bypasses view modal) - used by kebab menu
  const editTaskDirectly = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };
  
  const editTodoDirectly = (todo) => {
    setEditingTodo(todo);
    setShowTodoForm(true);
  };

  // =========================================================================
  // TODO HANDLERS
  // =========================================================================
  const openTodoForm = (todo = null) => {
    if (todo) {
        setViewingItem(todo);
        setViewingType('todo');
    } else {
        setEditingTodo(null);
        setShowTodoForm(true);
    }
  };

  const closeTodoForm = () => {
    setShowTodoForm(false);
    setEditingTodo(null);
  };

  const handleAddTodo = (todoData) => {
    contextAddTodo(todoData);
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
        <Header 
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onAddTask={() => openTaskForm()}
        />

        <NavigationTabs currentView={currentView} setCurrentView={setCurrentView} />

        <div className={`main-content-area grid gap-8 ${
            calendarExpanded && !isMobile
              ? "grid-cols-1 calendar-expanded"
              : "grid-cols-1 lg:grid-cols-4"
          }`}
        >
          <div className={
              calendarExpanded && !isMobile
                ? "calendar-expanded-area"
                : "lg:col-span-3"
            }
            style={{ transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }}
          >
            {currentView === "calendar" && (
              <div className={`calendar-container ${calendarExpanded && !isMobile ? "expanded" : ""}`}
                style={{ transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }}
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
                  onEditTask={editTaskDirectly}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            )}

            {currentView === "tasks" && (
              <TaskList
                tasks={tasks}
                onTaskClick={openTaskForm}
                onEditTask={editTaskDirectly}
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

            {currentView === "statistics" && <StatisticsView />}
          </div>

          <div className={`sidebar-area ${calendarExpanded && !isMobile ? "sidebar-below flex-row flex-wrap gap-8 px-[0.5rem] py-[1rem]" : "space-y-6"}`}
            style={{ transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }}
          >
            <QuickTodosCard onOpenTodoForm={openTodoForm} onEditTodo={editTodoDirectly} />
            <OverviewCard />
            <DailyTipCard dailyTip={dailyTip} />
          </div>
        </div>

        {/* === MODALS & NOTIFICATIONS === */}
        <DetailModal 
            isOpen={!!viewingItem}
            onClose={closeDetailModal}
            item={viewingItem}
            type={viewingType}
            onEdit={handleEditItem}
            onDelete={(id) => {
                if(viewingType === 'task') handleDeleteTask(id);
                else contextDeleteTodo(id);
                closeDetailModal();
            }}
            onToggleSubtask={handleToggleSubtaskComplete}
        />

        {showTaskForm && (
          <TaskForm
            task={editingTask}
            initialDate={showTaskForm.initialDate}
            onSave={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleAddTask}
            onCancel={closeTaskForm}
          />
        )}

        {showTodoForm && (
          <SimpleTodoForm
            todo={editingTodo}
            onSave={editingTodo ? (data) => handleUpdateTodo(editingTodo.id, data) : handleAddTodo}
            onCancel={closeTodoForm}
          />
        )}

        <ShortcutsModal open={showShortcutsModal} onOpenChange={setShowShortcutsModal} />

        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 min-w-[320px] max-w-[90vw] relative">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowSettingsModal(false); }}>
                <div>
                  <label className="block text-sm font-medium mb-1">Available Start Time</label>
                  <input type="time" value={availableHours.start}
                    onChange={(e) => setAvailableHours((h) => ({ ...h, start: e.target.value }))}
                    className="border rounded-md px-3 py-2 w-full dark:bg-gray-800" min="00:00" max="23:59" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Available End Time</label>
                  <input type="time" value={availableHours.end}
                    onChange={(e) => setAvailableHours((h) => ({ ...h, end: e.target.value }))}
                    className="border rounded-md px-3 py-2 w-full dark:bg-gray-800" min="00:00" max="23:59" />
                </div>
                
                <div className="pt-4 border-t border-border">
                  <Button variant="outline" type="button" onClick={async () => { 
                    await resetTour(); 
                    setShowSettingsModal(false); 
                    // Reload the page to ensure tour state is synced
                    window.location.reload();
                  }} className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" /> Restart Onboarding Tour
                  </Button>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" type="button" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
        
        <OnboardingTour />
        
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
      {isMobile && <div className="h-20" />}
    </div>
  );
}

export default App;
