import { createContext, useContext, useCallback, useMemo } from 'react';
import {
  useTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useToggleTodoCompleteMutation,
  useReorderTodosMutation,
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
  const { data: todos = [], isLoading, error, refetch } = useTodosQuery();
  
  const createTodoMutation = useCreateTodoMutation();
  const updateTodoMutation = useUpdateTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();
  const toggleCompleteMutation = useToggleTodoCompleteMutation();
  const reorderMutation = useReorderTodosMutation();

  const addTodo = useCallback((todoData) => {
    createTodoMutation.mutate(todoData);
  }, [createTodoMutation]);

  const updateTodo = useCallback((id, updates) => {
    updateTodoMutation.mutate({ id, updates });
  }, [updateTodoMutation]);

  const deleteTodo = useCallback((id) => {
    deleteTodoMutation.mutate(id);
    return todos.find(t => t.id === id);
  }, [todos, deleteTodoMutation]);

  const toggleTodoComplete = useCallback((id) => {
    const todo = todos.find(t => t.id === id);
    const newStatus = !todo?.isCompleted;

    toggleCompleteMutation.mutate(id);

    if (newStatus) {
      playCompleteSound();
    }

    return { todo, newStatus };
  }, [todos, toggleCompleteMutation]);

  const getPendingTodos = useCallback(() => {
    return todos.filter(todo => !todo.isCompleted);
  }, [todos]);

  const getCompletedTodos = useCallback(() => {
    return todos.filter(todo => todo.isCompleted);
  }, [todos]);

  const reorderTodos = useCallback((activeId, overId) => {
    reorderMutation.mutate({ activeId, overId });
  }, [reorderMutation]);

  const value = useMemo(() => ({
    todos,
    setTodos: () => {},
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getPendingTodos,
    getCompletedTodos,
    reorderTodos,
    refetch,
  }), [
    todos,
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getPendingTodos,
    getCompletedTodos,
    reorderTodos,
    refetch,
  ]);

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export default TodoContext;
