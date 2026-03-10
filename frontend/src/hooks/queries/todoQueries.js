import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { loadTodosAsync, saveTodos } from '../../utils/storage';

const TODOS_QUERY_KEY = ['todos'];

const isOnline = () => navigator.onLine;

export const useTodosQuery = () => {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: async () => {
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        return localTodos;
      }
      const response = await apiClient.get('/todos');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useTodoByIdQuery = (todoId) => {
  return useQuery({
    queryKey: [...TODOS_QUERY_KEY, 'detail', todoId],
    queryFn: async () => {
      const response = await apiClient.get(`/todos/${todoId}`);
      return response.data.data;
    },
    enabled: !!todoId,
  });
};

export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todoData) => {
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        const maxOrder = localTodos.reduce((max, t) => Math.max(max, t.order || 0), 0);
        const offlineTodo = {
          ...todoData,
          id: `offline_${Date.now()}`,
          _offline: true,
          order: maxOrder + 1,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        await saveTodos([...localTodos, offlineTodo]);
        return offlineTodo;
      }
      const response = await apiClient.post('/todos', todoData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useUpdateTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        const updatedTodos = localTodos.map((t) =>
          t.id === id ? { ...t, ...updates, _offline: true, updatedAt: new Date().toISOString() } : t
        );
        await saveTodos(updatedTodos);
        return { id, ...updates };
      }
      const response = await apiClient.patch(`/todos/${id}`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useDeleteTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        const filteredTodos = localTodos.filter((t) => t.id !== id);
        await saveTodos(filteredTodos);
        return id;
      }
      await apiClient.delete(`/todos/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useToggleTodoCompleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        const todo = localTodos.find((t) => t.id === id);
        if (todo) {
          const newStatus = !todo.isCompleted;
          const updatedTodos = localTodos.map((t) =>
            t.id === id ? { ...t, isCompleted: newStatus, _offline: true } : t
          );
          await saveTodos(updatedTodos);
          return { id, isCompleted: newStatus };
        }
        throw new Error('Todo not found');
      }
      const response = await apiClient.patch(`/todos/${id}/toggle-complete`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useReorderTodosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activeId, overId }) => {
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        const oldIndex = localTodos.findIndex((t) => t.id === activeId);
        const newIndex = localTodos.findIndex((t) => t.id === overId);

        if (oldIndex === -1 || newIndex === -1) {
          return { activeId, overId };
        }

        const newTodos = [...localTodos];
        const [movedItem] = newTodos.splice(oldIndex, 1);
        newTodos.splice(newIndex, 0, movedItem);

        const reorderedTodos = newTodos.map((t, index) => ({
          ...t,
          order: index,
          _offline: true,
        }));

        await saveTodos(reorderedTodos);
        return { activeId, overId };
      }
      const response = await apiClient.patch('/todos/reorder', { activeId, overId });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};
