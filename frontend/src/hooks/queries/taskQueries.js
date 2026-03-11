import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { loadTasksAsync, saveTasks } from '../../utils/storage';

const TASKS_QUERY_KEY = ['tasks'];

const isOnline = () => navigator.onLine;
const isAuthenticated = () => !!localStorage.getItem('authToken');

export const useTasksQuery = (filters = { limit: 1000 }) => {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, filters],
    queryFn: async () => {
      if (!isAuthenticated()) {
        return [];
      }
      if (!isOnline()) {
        const localTasks = await loadTasksAsync();
        return localTasks;
      }
      const params = new URLSearchParams(filters).toString();
      const response = await apiClient.get(`/tasks?${params}`);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useTaskByIdQuery = (taskId) => {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'detail', taskId],
    queryFn: async () => {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data.data;
    },
    enabled: !!taskId && isAuthenticated(),
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTasks = await loadTasksAsync();
        const offlineTask = {
          ...taskData,
          id: `offline_${Date.now()}`,
          _offline: true,
          createdAt: new Date().toISOString(),
          isCompleted: false,
        };
        await saveTasks([...localTasks, offlineTask]);
        queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) => [...old, offlineTask]);
        return { ...offlineTask, _queued: true };
      }
      const response = await apiClient.post('/tasks', taskData);
      return response.data.data;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      const optimisticTask = {
        ...newTask,
        id: newTask.id || `temp_${Date.now()}`,
        _optimistic: true,
        createdAt: new Date().toISOString(),
        isCompleted: false,
      };
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) => [...old, optimisticTask]);
      
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTasks = await loadTasksAsync();
        const updatedTasks = localTasks.map((t) =>
          t.id === id ? { ...t, ...updates, _offline: true, updatedAt: new Date().toISOString() } : t
        );
        await saveTasks(updatedTasks);
        queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
          old.map(t => t.id === id ? { ...t, ...updates, _offline: true } : t)
        );
        return { id, ...updates, _queued: true };
      }
      const response = await apiClient.patch(`/tasks/${id}`, updates);
      return response.data.data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => 
          task.id === id ? { ...task, ...updates, _optimistic: true } : task
        )
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTasks = await loadTasksAsync();
        const filteredTasks = localTasks.filter((t) => t.id !== id);
        await saveTasks(filteredTasks);
        queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
          old.filter(t => t.id !== id)
        );
        return { id, _queued: true };
      }
      await apiClient.delete(`/tasks/${id}`);
      return { id };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.filter(task => task.id !== id)
      );
      
      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useToggleTaskCompleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTasks = await loadTasksAsync();
        const task = localTasks.find((t) => t.id === id);
        if (task) {
          const newStatus = !task.isCompleted;
          const updatedTasks = localTasks.map((t) =>
            t.id === id ? { ...t, isCompleted: newStatus, _offline: true } : t
          );
          await saveTasks(updatedTasks);
          queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
            old.map(t => t.id === id ? { ...t, isCompleted: newStatus, _offline: true } : t)
          );
          return { id, isCompleted: newStatus, _queued: true };
        }
        throw new Error('Task not found');
      }
      const response = await apiClient.patch(`/tasks/${id}/toggle-complete`);
      return response.data.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => {
          if (task.id === id) {
            return { ...task, isCompleted: !task.isCompleted, _optimistic: true };
          }
          return task;
        })
      );
      
      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useBulkCompleteTasksMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids) => {
      if (!isAuthenticated()) return { ids };
      const response = await apiClient.post('/tasks/bulk-complete', { ids });
      return response.data.data;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => 
          ids.includes(task.id) ? { ...task, isCompleted: true, _optimistic: true } : task
        )
      );
      
      return { previousTasks };
    },
    onError: (err, ids, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useBulkDeleteTasksMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids) => {
      if (!isAuthenticated()) return { ids };
      const response = await apiClient.post('/tasks/bulk-delete', { ids });
      return response.data.data;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.filter(task => !ids.includes(task.id))
      );
      
      return { previousTasks };
    },
    onError: (err, ids, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useTaskStatisticsQuery = () => {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'statistics'],
    queryFn: async () => {
      if (!isAuthenticated()) return null;
      const response = await apiClient.get('/tasks/statistics');
      return response.data.data;
    },
    enabled: isAuthenticated(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddSubtaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtask }) => {
      if (!isAuthenticated()) {
        const { id: subtaskId, ...rest } = subtask;
        return { taskId, subtask: { ...rest, id: `temp_${Date.now()}`, _optimistic: true }, _queued: true };
      }
      const response = await apiClient.post(`/tasks/${taskId}/subtasks`, subtask);
      return response.data.data;
    },
    onMutate: async ({ taskId, subtask }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      const optimisticSubtask = {
        ...subtask,
        id: subtask.id || `temp_${Date.now()}`,
        _optimistic: true,
      };
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              subtasks: [...(task.subtasks || []), optimisticSubtask],
            };
          }
          return task;
        })
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useUpdateSubtaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId, updates }) => {
      if (!isAuthenticated()) return { taskId, subtaskId, updates, _queued: true };
      const response = await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
      return response.data.data;
    },
    onMutate: async ({ taskId, subtaskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, ...updates, _optimistic: true } : st
              ),
            };
          }
          return task;
        })
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useDeleteSubtaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId }) => {
      if (!isAuthenticated()) return { taskId, subtaskId, _queued: true };
      await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return { taskId, subtaskId };
    },
    onMutate: async ({ taskId, subtaskId }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId),
            };
          }
          return task;
        })
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useToggleSubtaskCompleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId }) => {
      if (!isAuthenticated()) return { taskId, subtaskId, _queued: true };
      const response = await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
      return response.data.data;
    },
    onMutate: async ({ taskId, subtaskId }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData(TASKS_QUERY_KEY);
      
      queryClient.setQueryData(TASKS_QUERY_KEY, (old = []) =>
        old.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted, _optimistic: true } : st
              ),
            };
          }
          return task;
        })
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const getTasksFromCache = (queryClient) => {
  return queryClient.getQueryData(TASKS_QUERY_KEY) || [];
};

export const setTasksCache = (queryClient, tasks) => {
  queryClient.setQueryData(TASKS_QUERY_KEY, tasks);
};
