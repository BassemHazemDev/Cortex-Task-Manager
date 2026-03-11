import { createContext, useContext, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  setTasksCache,
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
  const queryClient = useQueryClient();
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

  const setTasks = useCallback((newTasks) => {
    setTasksCache(queryClient, newTasks);
  }, [queryClient]);

  const addTask = useCallback(async (taskData) => {
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

      for (const task of repeatedTasks) {
        await createTaskMutation.mutateAsync(task).catch(() => {});
      }
      
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

    try {
      const result = await createTaskMutation.mutateAsync(taskData);
      // If it's an offline/queued task, it's already saved locally
      if (result?._queued || result?._optimistic) {
        return { success: true, offline: true };
      }
      return { success: true };
    } catch (error) {
      // Check if the task was still added optimistically
      const cachedTasks = queryClient.getQueryData(['tasks']) || [];
      const wasOptimisticallyAdded = cachedTasks.some(t => 
        t._optimistic || t._offline
      );
      if (wasOptimisticallyAdded) {
        return { success: true, offline: true };
      }
      return { success: false, message: error.message || 'Failed to create task' };
    }
  }, [tasks, hasTimeConflict, createTaskMutation, queryClient]);

  const updateTask = useCallback(async (taskId, updates) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return { success: false, message: 'Task not found' };
    
    const taskWithUpdates = { ...taskToUpdate, ...updates, id: taskId };
    
    if (hasTimeConflict(taskWithUpdates)) {
      return { 
        success: false, 
        message: 'This task overlaps with an existing task.' 
      };
    }

    try {
      await updateTaskMutation.mutateAsync({ id: taskId, updates });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update task' };
    }
  }, [tasks, hasTimeConflict, updateTaskMutation]);

  const deleteTask = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      return task;
    } catch (error) {
      return task;
    }
  }, [tasks, deleteTaskMutation]);

  const toggleTaskComplete = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newStatus = !task?.isCompleted;

    try {
      await toggleCompleteMutation.mutateAsync(taskId);
      if (newStatus) {
        playCompleteSound();
      }
      return { task, newStatus, success: true };
    } catch (error) {
      return { task, newStatus, success: false, error: error.message };
    }
  }, [tasks, toggleCompleteMutation]);

  const toggleSubtaskComplete = useCallback(async (taskId, subtaskId) => {
    try {
      await toggleSubtaskMutation.mutateAsync({ taskId, subtaskId });
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  }, [toggleSubtaskMutation]);

  const addSubtask = useCallback(async (taskId, subtask) => {
    try {
      await addSubtaskMutation.mutateAsync({ taskId, subtask });
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  }, [addSubtaskMutation]);

  const updateSubtask = useCallback(async (taskId, subtaskId, updates) => {
    try {
      await updateSubtaskMutation.mutateAsync({ taskId, subtaskId, updates });
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  }, [updateSubtaskMutation]);

  const deleteSubtask = useCallback(async (taskId, subtaskId) => {
    try {
      await deleteSubtaskMutation.mutateAsync({ taskId, subtaskId });
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  }, [deleteSubtaskMutation]);

  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => !task.isCompleted);
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.isCompleted);
  }, [tasks]);

  const isAnyMutationLoading = 
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    deleteTaskMutation.isPending ||
    toggleCompleteMutation.isPending ||
    addSubtaskMutation.isPending ||
    updateSubtaskMutation.isPending ||
    deleteSubtaskMutation.isPending ||
    toggleSubtaskMutation.isPending;

  const value = useMemo(() => ({
    tasks,
    setTasks,
    isLoading,
    isMutating: isAnyMutationLoading,
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
    mutationErrors: {
      create: createTaskMutation.error,
      update: updateTaskMutation.error,
      delete: deleteTaskMutation.error,
      toggle: toggleCompleteMutation.error,
      addSubtask: addSubtaskMutation.error,
      updateSubtask: updateSubtaskMutation.error,
      deleteSubtask: deleteSubtaskMutation.error,
      toggleSubtask: toggleSubtaskMutation.error,
    },
  }), [
    tasks,
    isLoading,
    isAnyMutationLoading,
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
    createTaskMutation.error,
    updateTaskMutation.error,
    deleteTaskMutation.error,
    toggleCompleteMutation.error,
    addSubtaskMutation.error,
    updateSubtaskMutation.error,
    deleteSubtaskMutation.error,
    toggleSubtaskMutation.error,
  ]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export default TaskContext;
