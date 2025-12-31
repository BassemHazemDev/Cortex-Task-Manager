/**
 * @module TodoContext
 * 
 * Provides TODO-related state and operations including:
 * - Todos array state
 * - CRUD operations (add, update, delete)
 * - Todo completion toggle
 * - Auto-save to IndexedDB
 * 
 * Note: This context handles data only. Notifications should be
 * displayed by the consuming components using AppContext.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadTodos, saveTodos } from '../utils/storage';
import { playCompleteSound } from '../utils/audioUtils';

const TodoContext = createContext(null);

/**
 * Custom hook to access the Todo context.
 * @returns {Object} Todo context value
 * @throws {Error} If used outside of TodoProvider
 */
export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
}

/**
 * TodoProvider component that manages todo state and operations.
 */
export function TodoProvider({ children }) {
  const [todos, setTodos] = useState(() => loadTodos());
  const [isLoading, setIsLoading] = useState(false);

  // Save todos to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveTodos(todos);
    }
  }, [todos, isLoading]);

  /**
   * Adds a new TODO.
   * @param {Object} todoData - The TODO data
   * @returns {Object} The new TODO
   */
  const addTodo = useCallback((todoData) => {
    const newTodo = {
      id: Date.now(),
      ...todoData,
      isCompleted: false,
    };
    
    setTodos(prev => [...prev, newTodo]);
    return newTodo;
  }, []);

  /**
   * Updates an existing TODO.
   * @param {number} id - The TODO ID to update
   * @param {Object} updates - The updates to apply
   */
  const updateTodo = useCallback((id, updates) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, ...updates } : todo
    ));
  }, []);

  /**
   * Deletes a TODO.
   * @param {number} id - The TODO ID to delete
   * @returns {Object} The deleted TODO
   */
  const deleteTodo = useCallback((id) => {
    const todo = todos.find(t => t.id === id);
    setTodos(prev => prev.filter(t => t.id !== id));
    return todo;
  }, [todos]);

  /**
   * Toggles the completion status of a TODO.
   * @param {number} id - The TODO ID to toggle
   * @returns {{ todo: Object, newStatus: boolean }}
   */
  const toggleTodoComplete = useCallback((id) => {
    const todo = todos.find(t => t.id === id);
    const newStatus = !todo?.isCompleted;
    
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, isCompleted: newStatus } : t
    ));

    if (newStatus) {
      playCompleteSound();
    }

    return { todo, newStatus };
  }, [todos]);

  /**
   * Gets all pending (incomplete) TODOs.
   */
  const getPendingTodos = useCallback(() => {
    return todos.filter(todo => !todo.isCompleted);
  }, [todos]);

  /**
   * Gets all completed TODOs.
   */
  const getCompletedTodos = useCallback(() => {
    return todos.filter(todo => todo.isCompleted);
  }, [todos]);

  const value = {
    todos,
    setTodos,
    isLoading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getPendingTodos,
    getCompletedTodos,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export default TodoContext;
