/**
 * @module LoadingSkeleton
 * 
 * Reusable loading skeleton components for improved perceived performance.
 * These components display while data is loading from storage.
 */

import { memo } from 'react';

/**
 * Base skeleton component with shimmer animation.
 */
export const Skeleton = memo(function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={style}
    />
  );
});

/**
 * Skeleton for task cards in the calendar view.
 */
export const TaskCardSkeleton = memo(function TaskCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border bg-card animate-pulse">
      <div className="flex items-center space-x-3">
        {/* Checkbox skeleton */}
        <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        
        <div className="flex-1 space-y-2">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          
          {/* Time and duration skeleton */}
          <div className="flex items-center space-x-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
          </div>
        </div>

        {/* Priority badge skeleton */}
        <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
});

/**
 * Skeleton for calendar day cells.
 */
export const CalendarDaySkeleton = memo(function CalendarDaySkeleton() {
  return (
    <div className="p-2 border border-border rounded-lg bg-card animate-pulse">
      {/* Day number skeleton */}
      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
      
      {/* Task items skeleton */}
      <div className="space-y-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );
});

/**
 * Skeleton for TODO items.
 */
export const TodoItemSkeleton = memo(function TodoItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-card animate-pulse">
      {/* Checkbox skeleton */}
      <div className="w-5 h-5 rounded border-2 border-gray-200 dark:border-gray-700 flex-shrink-0" />
      
      <div className="flex-1 space-y-2">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        
        {/* Description skeleton */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>

      {/* Delete button skeleton */}
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
    </div>
  );
});

/**
 * Full page loading skeleton for the main app.
 */
export const AppLoadingSkeleton = memo(function AppLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="flex space-x-2">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border border-border rounded-lg bg-card">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Calendar skeleton */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <CalendarDaySkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

/**
 * Task list loading skeleton.
 */
export const TaskListSkeleton = memo(function TaskListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
});

/**
 * TODO list loading skeleton.
 */
export const TodoListSkeleton = memo(function TodoListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <TodoItemSkeleton key={i} />
      ))}
    </div>
  );
});

export default {
  Skeleton,
  TaskCardSkeleton,
  CalendarDaySkeleton,
  TodoItemSkeleton,
  AppLoadingSkeleton,
  TaskListSkeleton,
  TodoListSkeleton,
};
