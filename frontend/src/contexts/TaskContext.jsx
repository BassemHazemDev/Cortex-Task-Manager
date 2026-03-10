import { createContext, useContext, useCallback, useMemo } from 'react';
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleTaskCompleteMutation,
  useAddSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useToggleSubtaskCompleteMutation,
} from '../hooks/queries/taskQueries';
import { playCompleteSound } from '../utils/audioUtils';
import { pad } from '../utils/dateUtils';

const TaskContext = createContext(null);

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

export function TaskProvider({ children }) {
  const { data: tasks = [], isLoading, error, refetch } = useTasksQuery();
  
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();
  const toggleCompleteMutation = useToggleTaskCompleteMutation();
  const addSubtaskMutation = useAddSubtaskMutation();
  const updateSubtaskMutation = useUpdateSubtaskMutation();
  const deleteSubtaskMutation = useDeleteSubtaskMutation();
  const toggleSubtaskMutation = useToggleSubtaskCompleteMutation();

  const hasTimeConflict = useCallback((newTask, existingTasks = tasks) => {
    if (!newTask.dueDate || !newTask.dueTime || !newTask.estimatedDuration) {
      return false;
    }
    
    const newStart = new Date(`${newTask.dueDate}T${newTask.dueTime}`);
    const newEnd = new Date(newStart.getTime() + newTask.estimatedDuration * 60000);
    
    return existingTasks.some((task) => {
      if (task.id === newTask.id) return false;
      
      if (
        task.isCompleted ||
        task.dueDate !== newTask.dueDate ||
        !task.dueTime ||
        !task.estimatedDuration
      ) {
        return false;
      }
      const start = new Date(`${task.dueDate}T${task.dueTime}`);
      const end = new Date(start.getTime() + task.estimatedDuration * 60000);
      return newStart < end && start < newEnd;
    });
  }, [tasks]);

  const addTask = useCallback((taskData) => {
    if (taskData.repeatUntil && taskData.repeatFrequency !== 'none' && taskData.dueDate) {
      const repeatedTasks = [];
      let currentDate = new Date(`${taskData.dueDate}T${taskData.dueTime || '00:00'}`);
      const repeatUntilDate = new Date(`${taskData.repeatUntil}T${taskData.dueTime || '00:00'}`);
      let i = 0;
      let conflictFound = false;

      while (currentDate <= repeatUntilDate) {
        const candidateDate = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
        const candidateTime = `${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;
        const candidate = { ...taskData, dueDate: candidateDate, dueTime: candidateTime };

        if (hasTimeConflict(candidate, [...tasks, ...repeatedTasks])) {
          conflictFound = true;
          break;
        }

        repeatedTasks.push({
          ...candidate,
          id: Date.now() + i,
          isCompleted: false,
          assignedSlot: null,
        });

        switch (taskData.repeatFrequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            break;
        }
        i++;
      }

      if (conflictFound) {
        return { 
          success: false, 
          message: 'One or more repeated tasks overlap with existing tasks.' 
        };
      }

      repeatedTasks.forEach(task => {
        createTaskMutation.mutate(task);
      });
      
      return { 
        success: true, 
        tasksAdded: repeatedTasks.length,
        message: `${repeatedTasks.length} tasks created (${taskData.repeatFrequency} until ${taskData.repeatUntil})`
      };
    }

    if (hasTimeConflict(taskData)) {
      return { 
        success: false, 
        message: 'This task overlaps with an existing task.' 
      };
    }

    createTaskMutation.mutate(taskData);
    return { success: true };
  }, [tasks, hasTimeConflict, createTaskMutation]);

  const updateTask = useCallback((taskId, updates) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return { success: false, message: 'Task not found' };
    
    const taskWithUpdates = { ...taskToUpdate, ...updates, id: taskId };
    
    if (hasTimeConflict(taskWithUpdates)) {
      return { 
        success: false, 
        message: 'This task overlaps with an existing task.' 
      };
    }

    updateTaskMutation.mutate({ id: taskId, updates });
    return { success: true };
  }, [tasks, hasTimeConflict, updateTaskMutation]);

  const deleteTask = useCallback((taskId) => {
    deleteTaskMutation.mutate(taskId);
    return tasks.find(t => t.id === taskId);
  }, [tasks, deleteTaskMutation]);

  const toggleTaskComplete = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newStatus = !task?.isCompleted;

    toggleCompleteMutation.mutate(taskId);

    if (newStatus) {
      playCompleteSound();
    }

    return { task, newStatus };
  }, [tasks, toggleCompleteMutation]);

  const toggleSubtaskComplete = useCallback((taskId, subtaskId) => {
    toggleSubtaskMutation.mutate({ taskId, subtaskId });
  }, [toggleSubtaskMutation]);

  const addSubtask = useCallback((taskId, subtask) => {
    addSubtaskMutation.mutate({ taskId, subtask });
  }, [addSubtaskMutation]);

  const updateSubtask = useCallback((taskId, subtaskId, updates) => {
    updateSubtaskMutation.mutate({ taskId, subtaskId, updates });
  }, [updateSubtaskMutation]);

  const deleteSubtask = useCallback((taskId, subtaskId) => {
    deleteSubtaskMutation.mutate({ taskId, subtaskId });
  }, [deleteSubtaskMutation]);

  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => !task.isCompleted);
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.isCompleted);
  }, [tasks]);

  const value = useMemo(() => ({
    tasks,
    setTasks: () => {},
    isLoading,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubtaskComplete,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    hasTimeConflict,
    getPendingTasks,
    getCompletedTasks,
  }), [
    tasks,
    isLoading,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubtaskComplete,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    hasTimeConflict,
    getPendingTasks,
    getCompletedTasks,
  ]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export default TaskContext;
