import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';

const SYNC_QUEUE_KEY = 'offline_sync_queue';

export function useOfflineSync() {
  const queryClient = useQueryClient();

  const isOnline = () => navigator.onLine;
  const isAuthenticated = () => !!localStorage.getItem('authToken');

  const processQueue = useCallback(async () => {
    if (!isOnline() || !isAuthenticated()) return;

    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    const processedIds = [];

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'CREATE_TASK':
            await apiClient.post('/tasks', action.data);
            break;
          case 'UPDATE_TASK':
            await apiClient.patch(`/tasks/${action.data.id}`, action.data.updates);
            break;
          case 'DELETE_TASK':
            await apiClient.delete(`/tasks/${action.id}`);
            break;
          case 'TOGGLE_TASK':
            await apiClient.patch(`/tasks/${action.id}/toggle-complete`);
            break;
          case 'CREATE_TODO':
            await apiClient.post('/todos', action.data);
            break;
          case 'UPDATE_TODO':
            await apiClient.patch(`/todos/${action.data.id}`, action.data.updates);
            break;
          case 'DELETE_TODO':
            await apiClient.delete(`/todos/${action.id}`);
            break;
          case 'TOGGLE_TODO':
            await apiClient.patch(`/todos/${action.id}/toggle-complete`);
            break;
          case 'REORDER_TODOS':
            await apiClient.patch('/todos/reorder', { activeId: action.data.activeId, overId: action.data.overId });
            break;
          default:
            break;
        }
        processedIds.push(action.timestamp);
      } catch (error) {
        console.error('Failed to sync offline action:', action, error);
      }
    }

    const remainingQueue = queue.filter(item => !processedIds.includes(item.timestamp));
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));

    if (remainingQueue.length === 0) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  }, [queryClient]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online! Syncing offline data...');
      processQueue();
    };

    window.addEventListener('online', handleOnline);

    if (isOnline() && isAuthenticated()) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processQueue]);

  return { processQueue };
}

export default useOfflineSync;
