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

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadTodos, loadTodosAsync, saveTodos } from '../utils/storage';
import { playCompleteSound } from '../utils/audioUtils';
import { useCrossTabSync, broadcastSync } from '../hooks/useCrossTabSync';

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
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isSyncing = useRef(false);

  // Load todos on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Ensure storage is ready/migrated
        // (If TaskContext runs first, this is fast no-op)
        const loadedTodos = await loadTodosAsync();
        setTodos(loadedTodos);
      } catch (error) {
        console.error('Error loading todos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Handle cross-tab sync
  const handleSync = useCallback(async (type) => {
    if (type === 'todos') {
      try {
        const newTodos = await loadTodosAsync();
        isSyncing.current = true; // Prevent echo
        setTodos(newTodos);
      } catch (error) {
        console.error('Error syncing todos:', error);
      }
    }
  }, []);

  useCrossTabSync(handleSync);

  // Save todos to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      if (isSyncing.current) {
        isSyncing.current = false;
        return;
      }
      saveTodos(todos);
      broadcastSync('TODOS_UPDATED');
    }
  }, [todos, isLoading]);

  /**
   * Adds a new TODO.
   * @param {Object} todoData - The TODO data
   * @returns {Object} The new TODO
   */
  const addTodo = useCallback((todoData) => {
    // Find max order to put new item at the end
    const maxOrder = todos.reduce((max, t) => Math.max(max, t.order || 0), 0);
    
    const newTodo = {
      id: Date.now(),
      order: maxOrder + 1,
      ...todoData,
      isCompleted: false,
    };
    
    setTodos(prev => [...prev, newTodo]);
    return newTodo;
  }, [todos]);

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

  /**
   * Reorders todos using the active and over IDs from drag-and-drop.
   * @param {number|string} activeId - The ID of the item being dragged
   * @param {number|string} overId - The ID of the item it was dropped over
   */
  const reorderTodos = useCallback((activeId, overId) => {
    // console.log('reorderTodos called:', { activeId, overId });
    setTodos((prevTodos) => {
      const oldIndex = prevTodos.findIndex((t) => t.id === activeId);
      const newIndex = prevTodos.findIndex((t) => t.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) {
          // console.warn('Could not find active or over item');
          return prevTodos;
      }

      // Create new array copy
      const newTodos = [...prevTodos];
      // Move element
      const [movedItem] = newTodos.splice(oldIndex, 1);
      newTodos.splice(newIndex, 0, movedItem);

      // Re-assign order based on new index
      return newTodos.map((t, index) => ({
        ...t,
        order: index
      }));
    });
  }, []);

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
    reorderTodos,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export default TodoContext;
