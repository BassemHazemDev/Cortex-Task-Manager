import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { loadTasksAsync, saveTasks } from '../../utils/storage';

const TASKS_QUERY_KEY = ['tasks'];

const isOnline = () => navigator.onLine;

export const useTasksQuery = (filters = {}) => {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, filters],
    queryFn: async () => {
      if (!isOnline()) {
        const localTasks = await loadTasksAsync();
        return localTasks;
      }
      const params = new URLSearchParams(filters).toString();
      const response = await apiClient.get(`/tasks?${params}`);
      return response.data.data;
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
    enabled: !!taskId,
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData) => {
      if (!isOnline()) {
        const localTasks = await loadTasksAsync();
        const offlineTask = {
          ...taskData,
          id: `offline_${Date.now()}`,
          _offline: true,
          createdAt: new Date().toISOString(),
          isCompleted: false,
        };
        await saveTasks([...localTasks, offlineTask]);
        return offlineTask;
      }
      const response = await apiClient.post('/tasks', taskData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!isOnline()) {
        const localTasks = await loadTasksAsync();
        const updatedTasks = localTasks.map((t) =>
          t.id === id ? { ...t, ...updates, _offline: true, updatedAt: new Date().toISOString() } : t
        );
        await saveTasks(updatedTasks);
        return { id, ...updates };
      }
      const response = await apiClient.patch(`/tasks/${id}`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline()) {
        const localTasks = await loadTasksAsync();
        const filteredTasks = localTasks.filter((t) => t.id !== id);
        await saveTasks(filteredTasks);
        return id;
      }
      await apiClient.delete(`/tasks/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useToggleTaskCompleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline()) {
        const localTasks = await loadTasksAsync();
        const task = localTasks.find((t) => t.id === id);
        if (task) {
          const newStatus = !task.isCompleted;
          const updatedTasks = localTasks.map((t) =>
            t.id === id ? { ...t, isCompleted: newStatus, _offline: true } : t
          );
          await saveTasks(updatedTasks);
          return { id, isCompleted: newStatus };
        }
        throw new Error('Task not found');
      }
      const response = await apiClient.patch(`/tasks/${id}/toggle-complete`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useBulkCompleteTasksMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids) => {
      const response = await apiClient.post('/tasks/bulk-complete', { ids });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useBulkDeleteTasksMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids) => {
      const response = await apiClient.post('/tasks/bulk-delete', { ids });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useTaskStatisticsQuery = () => {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'statistics'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks/statistics');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddSubtaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtask }) => {
      const response = await apiClient.post(`/tasks/${taskId}/subtasks`, subtask);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useUpdateSubtaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId, updates }) => {
      const response = await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useDeleteSubtaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId }) => {
      await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return { taskId, subtaskId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};

export const useToggleSubtaskCompleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, subtaskId }) => {
      const response = await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
};
