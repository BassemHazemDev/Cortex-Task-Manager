import { createContext, useContext, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useToggleTodoCompleteMutation,
  useReorderTodosMutation,
  setTodosCache,
} from '../hooks/queries/todoQueries';
import { playCompleteSound } from '../utils/audioUtils';

const TodoContext = createContext(null);

export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
}

export function TodoProvider({ children }) {
  const queryClient = useQueryClient();
  const { data: todos = [], isLoading, error, refetch } = useTodosQuery();
  
  const createTodoMutation = useCreateTodoMutation();
  const updateTodoMutation = useUpdateTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();
  const toggleCompleteMutation = useToggleTodoCompleteMutation();
  const reorderMutation = useReorderTodosMutation();

  const setTodos = useCallback((newTodos) => {
    setTodosCache(queryClient, newTodos);
  }, [queryClient]);

  const addTodo = useCallback(async (todoData) => {
    try {
      await createTodoMutation.mutateAsync(todoData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to create todo' };
    }
  }, [createTodoMutation]);

  const updateTodo = useCallback(async (id, updates) => {
    try {
      await updateTodoMutation.mutateAsync({ id, updates });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update todo' };
    }
  }, [updateTodoMutation]);

  const deleteTodo = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    try {
      await deleteTodoMutation.mutateAsync(id);
      return todo;
    } catch (error) {
      return todo;
    }
  }, [todos, deleteTodoMutation]);

  const toggleTodoComplete = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    const newStatus = !todo?.isCompleted;

    try {
      await toggleCompleteMutation.mutateAsync(id);
      if (newStatus) {
        playCompleteSound();
      }
      return { todo, newStatus, success: true };
    } catch (error) {
      return { todo, newStatus, success: false, error: error.message };
    }
  }, [todos, toggleCompleteMutation]);

  const getPendingTodos = useCallback(() => {
    return todos.filter(todo => !todo.isCompleted);
  }, [todos]);

  const getCompletedTodos = useCallback(() => {
    return todos.filter(todo => todo.isCompleted);
  }, [todos]);

  const reorderTodos = useCallback(async (activeId, overId) => {
    try {
      await reorderMutation.mutateAsync({ activeId, overId });
    } catch (error) {
      console.error('Failed to reorder todos:', error);
    }
  }, [reorderMutation]);

  const isAnyMutationLoading = 
    createTodoMutation.isPending ||
    updateTodoMutation.isPending ||
    deleteTodoMutation.isPending ||
    toggleCompleteMutation.isPending ||
    reorderMutation.isPending;

  const value = useMemo(() => ({
    todos,
    setTodos,
    isLoading,
    isMutating: isAnyMutationLoading,
    error,
    refetch,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getPendingTodos,
    getCompletedTodos,
    reorderTodos,
    mutationErrors: {
      create: createTodoMutation.error,
      update: updateTodoMutation.error,
      delete: deleteTodoMutation.error,
      toggle: toggleCompleteMutation.error,
      reorder: reorderMutation.error,
    },
  }), [
    todos,
    isLoading,
    isAnyMutationLoading,
    error,
    refetch,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getPendingTodos,
    getCompletedTodos,
    reorderTodos,
    createTodoMutation.error,
    updateTodoMutation.error,
    deleteTodoMutation.error,
    toggleCompleteMutation.error,
    reorderMutation.error,
  ]);

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export default TodoContext;
