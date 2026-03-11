import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { loadTodosAsync, saveTodos } from '../../utils/storage';

const TODOS_QUERY_KEY = ['todos'];

const isOnline = () => navigator.onLine;
const isAuthenticated = () => !!localStorage.getItem('authToken');

export const useTodosQuery = () => {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: async () => {
      if (!isAuthenticated()) {
        return [];
      }
      if (!isOnline()) {
        const localTodos = await loadTodosAsync();
        return localTodos;
      }
      const response = await apiClient.get('/todos');
      return response.data.data || [];
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
    enabled: !!todoId && isAuthenticated(),
  });
};

export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todoData) => {
      if (!isOnline() || !isAuthenticated()) {
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
        queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) => [...old, offlineTodo]);
        return { ...offlineTodo, _queued: true };
      }
      const response = await apiClient.post('/todos', todoData);
      return response.data.data;
    },
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData(TODOS_QUERY_KEY);
      
      const localTodos = await loadTodosAsync();
      const maxOrder = localTodos.reduce((max, t) => Math.max(max, t.order || 0), 0);
      
      const optimisticTodo = {
        ...newTodo,
        id: newTodo.id || `temp_${Date.now()}`,
        _optimistic: true,
        order: maxOrder + 1,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) => [...old, optimisticTodo]);
      
      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useUpdateTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTodos = await loadTodosAsync();
        const updatedTodos = localTodos.map((t) =>
          t.id === id ? { ...t, ...updates, _offline: true, updatedAt: new Date().toISOString() } : t
        );
        await saveTodos(updatedTodos);
        queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) =>
          old.map(t => t.id === id ? { ...t, ...updates, _offline: true } : t)
        );
        return { id, ...updates, _queued: true };
      }
      const response = await apiClient.patch(`/todos/${id}`, updates);
      return response.data.data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData(TODOS_QUERY_KEY);
      
      queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) =>
        old.map(todo => 
          todo.id === id ? { ...todo, ...updates, _optimistic: true } : todo
        )
      );
      
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useDeleteTodoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTodos = await loadTodosAsync();
        const filteredTodos = localTodos.filter((t) => t.id !== id);
        await saveTodos(filteredTodos);
        queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) =>
          old.filter(t => t.id !== id)
        );
        return { id, _queued: true };
      }
      await apiClient.delete(`/todos/${id}`);
      return { id };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData(TODOS_QUERY_KEY);
      
      queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) =>
        old.filter(todo => todo.id !== id)
      );
      
      return { previousTodos };
    },
    onError: (err, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useToggleTodoCompleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!isOnline() || !isAuthenticated()) {
        const localTodos = await loadTodosAsync();
        const todo = localTodos.find((t) => t.id === id);
        if (todo) {
          const newStatus = !todo.isCompleted;
          const updatedTodos = localTodos.map((t) =>
            t.id === id ? { ...t, isCompleted: newStatus, _offline: true } : t
          );
          await saveTodos(updatedTodos);
          queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) =>
            old.map(t => t.id === id ? { ...t, isCompleted: newStatus, _offline: true } : t)
          );
          return { id, isCompleted: newStatus, _queued: true };
        }
        throw new Error('Todo not found');
      }
      const response = await apiClient.patch(`/todos/${id}/toggle-complete`);
      return response.data.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData(TODOS_QUERY_KEY);
      
      queryClient.setQueryData(TODOS_QUERY_KEY, (old = []) =>
        old.map(todo => {
          if (todo.id === id) {
            return { ...todo, isCompleted: !todo.isCompleted, _optimistic: true };
          }
          return todo;
        })
      );
      
      return { previousTodos };
    },
    onError: (err, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useReorderTodosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activeId, overId }) => {
      if (!isOnline() || !isAuthenticated()) {
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
        queryClient.setQueryData(TODOS_QUERY_KEY, reorderedTodos);
        return { activeId, overId, _queued: true };
      }
      const response = await apiClient.patch('/todos/reorder', { activeId, overId });
      return response.data.data;
    },
    onMutate: async ({ activeId, overId }) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData(TODOS_QUERY_KEY);
      
      const oldIndex = previousTodos.findIndex((t) => t.id === activeId);
      const newIndex = previousTodos.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTodos = [...previousTodos];
        const [movedItem] = newTodos.splice(oldIndex, 1);
        newTodos.splice(newIndex, 0, movedItem);
        
        const reorderedTodos = newTodos.map((t, index) => ({
          ...t,
          order: index,
          _optimistic: true,
        }));
        
        queryClient.setQueryData(TODOS_QUERY_KEY, reorderedTodos);
      }
      
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const getTodosFromCache = (queryClient) => {
  return queryClient.getQueryData(TODOS_QUERY_KEY) || [];
};

export const setTodosCache = (queryClient, todos) => {
  queryClient.setQueryData(TODOS_QUERY_KEY, todos);
};
