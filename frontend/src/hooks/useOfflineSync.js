import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loadTasksAsync, saveTasks } from '../utils/storage';
import apiClient from '../lib/api';

export function useOfflineSync() {
  const queryClient = useQueryClient();

  const syncOfflineTasks = useCallback(async () => {
    try {
      const offlineTasks = await loadTasksAsync();
      const pendingTasks = offlineTasks.filter((t) => t._offline);

      for (const task of pendingTasks) {
        try {
          if (task.id.toString().startsWith('offline_')) {
            const { _offline, id, ...taskData } = task;
            const response = await apiClient.post('/tasks', taskData);
            const serverTask = response.data.data;

            const allTasks = await loadTasksAsync();
            const updatedTasks = allTasks.map((t) =>
              t.id === id ? { ...serverTask, _synced: true } : t
            );
            await saveTasks(updatedTasks);
          } else {
            const { _offline, id, ...taskData } = task;
            await apiClient.patch(`/tasks/${id}`, taskData);

            const allTasks = await loadTasksAsync();
            const updatedTasks = allTasks.map((t) =>
              t.id === id ? { ...t, _offline: false, _synced: true } : t
            );
            await saveTasks(updatedTasks);
          }
        } catch (error) {
          console.error(`Failed to sync task ${task.id}:`, error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Failed to sync offline tasks:', error);
    }
  }, [queryClient]);

  const syncOfflineTodos = useCallback(async () => {
    try {
      const db = (await import('../utils/db')).default;
      const offlineTodos = await db.todos.where('_offline').equals(1).toArray();

      for (const todo of offlineTodos) {
        try {
          if (todo.id.toString().startsWith('offline_')) {
            const { _offline, id, ...todoData } = todo;
            const response = await apiClient.post('/todos', todoData);
            const serverTodo = response.data.data;

            const allTodos = await db.todos.toArray();
            const updatedTodos = allTodos.map((t) =>
              t.id === id ? { ...serverTodo, _offline: 0 } : t
            );
            await db.todos.bulkPut(updatedTodos);
          } else {
            const { _offline, id, ...todoData } = todo;
            await apiClient.patch(`/todos/${id}`, todoData);

            const allTodos = await db.todos.toArray();
            const updatedTodos = allTodos.map((t) =>
              t.id === id ? { ...t, _offline: 0 } : t
            );
            await db.todos.bulkPut(updatedTodos);
          }
        } catch (error) {
          console.error(`Failed to sync todo ${todo.id}:`, error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['todos'] });
    } catch (error) {
      console.error('Failed to sync offline todos:', error);
    }
  }, [queryClient]);

  const syncAllOfflineData = useCallback(async () => {
    if (!navigator.onLine) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    await Promise.all([syncOfflineTasks(), syncOfflineTodos()]);
  }, [queryClient, syncOfflineTasks, syncOfflineTodos]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online! Syncing offline data...');
      syncAllOfflineData();
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      syncAllOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncAllOfflineData]);

  return { syncAllOfflineData };
}

export default useOfflineSync;
