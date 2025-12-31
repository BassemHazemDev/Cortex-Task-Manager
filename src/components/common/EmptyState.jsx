/**
 * @module EmptyState
 * 
 * Reusable empty state component with themed illustrations.
 * Matches the application's OKLCH color system and design tokens.
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle, Search, Sparkles, ListChecks } from 'lucide-react';

/**
 * Animated SVG illustrations matching the app's design system
 */
const illustrations = {
  tasks: ({ className }) => (
    <div className={className}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Clipboard background */}
        <rect x="25" y="15" width="70" height="90" rx="8" 
          className="fill-muted stroke-border" strokeWidth="2" />
        <rect x="40" y="8" width="40" height="12" rx="4" 
          className="fill-primary/20 stroke-primary/40" strokeWidth="1.5" />
        {/* Task lines */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <circle cx="42" cy="45" r="5" className="fill-primary/30" />
          <rect x="55" y="42" width="30" height="6" rx="2" className="fill-muted-foreground/20" />
          
          <circle cx="42" cy="65" r="5" className="fill-primary/20" />
          <rect x="55" y="62" width="25" height="6" rx="2" className="fill-muted-foreground/15" />
          
          <circle cx="42" cy="85" r="5" className="fill-primary/10" />
          <rect x="55" y="82" width="28" height="6" rx="2" className="fill-muted-foreground/10" />
        </motion.g>
        {/* Floating plus */}
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="95" cy="25" r="12" className="fill-primary shadow-lg" />
          <path d="M95 20 L95 30 M90 25 L100 25" 
            className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </svg>
    </div>
  ),

  calendar: ({ className }) => (
    <div className={className}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Calendar body */}
        <rect x="15" y="25" width="90" height="80" rx="8" 
          className="fill-card stroke-border" strokeWidth="2" />
        {/* Calendar header */}
        <rect x="15" y="25" width="90" height="20" rx="8" 
          className="fill-primary/20" />
        <rect x="15" y="35" width="90" height="10" className="fill-primary/20" />
        {/* Calendar pins */}
        <rect x="35" y="18" width="4" height="14" rx="2" className="fill-primary" />
        <rect x="81" y="18" width="4" height="14" rx="2" className="fill-primary" />
        {/* Days grid */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {[0, 1, 2, 3, 4].map((row) => (
            [0, 1, 2, 3, 4, 5, 6].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={22 + col * 12}
                y={52 + row * 10}
                width="8"
                height="6"
                rx="1"
                className={`${row === 2 && col === 3 ? 'fill-primary' : 'fill-muted/50'}`}
              />
            ))
          ))}
        </motion.g>
      </svg>
    </div>
  ),

  todos: ({ className }) => (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Checkmark circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="35"
          className="fill-none stroke-primary/30"
          strokeWidth="4"
          strokeDasharray="220"
          initial={{ strokeDashoffset: 220 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Checkmark */}
        <motion.path
          d="M35 50 L45 60 L65 40"
          className="fill-none stroke-primary"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
        {/* Sparkles */}
        <motion.g
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="20" cy="25" r="3" className="fill-primary/40" />
          <circle cx="80" cy="30" r="2" className="fill-primary/30" />
          <circle cx="75" cy="75" r="2.5" className="fill-primary/35" />
        </motion.g>
      </svg>
    </div>
  ),

  search: ({ className }) => (
    <div className={className}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Magnifying glass */}
        <motion.circle
          cx="50"
          cy="50"
          r="25"
          className="fill-muted stroke-primary/40"
          strokeWidth="4"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        <motion.line
          x1="68"
          y1="68"
          x2="90"
          y2="90"
          className="stroke-primary/40"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        />
        {/* Search lines */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <rect x="38" y="42" width="24" height="4" rx="2" className="fill-muted-foreground/20" />
          <rect x="38" y="52" width="18" height="4" rx="2" className="fill-muted-foreground/15" />
        </motion.g>
        {/* Question marks floating */}
        <motion.text
          x="95"
          y="35"
          className="fill-muted-foreground/30 text-lg font-bold"
          animate={{ y: [35, 30, 35] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ?
        </motion.text>
      </svg>
    </div>
  ),

  scheduler: ({ className }) => (
    <div className={className}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Magic wand */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: '60px 60px' }}
        >
          <rect x="30" y="55" width="60" height="10" rx="2" 
            className="fill-primary" transform="rotate(-45 60 60)" />
          <rect x="75" y="40" width="15" height="20" rx="3" 
            className="fill-primary/80" transform="rotate(-45 60 60)" />
        </motion.g>
        {/* Sparkles */}
        <motion.g
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M85 25 L87 30 L92 28 L88 32 L92 36 L87 34 L85 39 L83 34 L78 36 L82 32 L78 28 L83 30 Z"
            className="fill-primary/60" />
        </motion.g>
        <motion.g
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <path d="M25 45 L26 48 L29 47 L27 50 L30 52 L26 51 L25 54 L24 51 L20 52 L23 50 L20 47 L24 48 Z"
            className="fill-primary/40" />
        </motion.g>
        <motion.g
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <path d="M40 85 L41 88 L44 87 L42 89 L45 91 L41 90 L40 93 L39 90 L35 91 L38 89 L35 87 L39 88 Z"
            className="fill-primary/50" />
        </motion.g>
      </svg>
    </div>
  ),
};

/**
 * EmptyState component props
 * @typedef {Object} EmptyStateProps
 * @property {'tasks'|'calendar'|'todos'|'search'|'scheduler'} type - Type of empty state
 * @property {string} title - Main heading text
 * @property {string} description - Supporting description text
 * @property {Function} [action] - Optional action handler
 * @property {string} [actionLabel] - Button label for action
 * @property {React.ReactNode} [actionIcon] - Icon for action button
 */

/**
 * Reusable empty state component with animated illustrations
 * @param {EmptyStateProps} props
 */
export function EmptyState({ 
  type = 'tasks', 
  title, 
  description, 
  action,
  actionLabel,
  actionIcon
}) {
  const Illustration = illustrations[type] || illustrations.tasks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center py-8 px-4"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-4"
      >
        <Illustration className="w-28 h-28 mx-auto" />
      </motion.div>
      
      <h3 className="text-lg font-semibold text-foreground mt-4">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
        {description}
      </p>
      
      {action && actionLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button 
            onClick={action} 
            className="mt-5 shadow-md hover:shadow-lg transition-all"
          >
            {actionIcon || <Plus className="h-4 w-4 mr-2" />}
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Pre-configured empty state variants for common use cases
 */
export const EmptyTaskList = ({ onAddTask }) => (
  <EmptyState
    type="tasks"
    title="No tasks yet"
    description="Create your first task to start organizing your day!"
    action={onAddTask}
    actionLabel="Add Task"
    actionIcon={<Plus className="h-4 w-4 mr-2" />}
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    type="search"
    title="No tasks found"
    description="Try adjusting your filters or search terms"
  />
);

export const EmptyCalendarDay = ({ onAddTask }) => (
  <EmptyState
    type="calendar"
    title="Nothing scheduled"
    description="Click to add a task for this date"
    action={onAddTask}
    actionLabel="Schedule Task"
    actionIcon={<Calendar className="h-4 w-4 mr-2" />}
  />
);

export const EmptyTodoList = ({ onAddTodo }) => (
  <EmptyState
    type="todos"
    title="All caught up!"
    description="Add quick TODOs to stay organized"
    action={onAddTodo}
    actionLabel="Add TODO"
    actionIcon={<ListChecks className="h-4 w-4 mr-2" />}
  />
);

export const EmptyScheduler = () => (
  <EmptyState
    type="scheduler"
    title="Ready to optimize"
    description="Add some tasks and let the Smart Scheduler organize your day"
    actionIcon={<Sparkles className="h-4 w-4 mr-2" />}
  />
);

export default EmptyState;
