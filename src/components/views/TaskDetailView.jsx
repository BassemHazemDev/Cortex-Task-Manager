import React from 'react';
import { Calendar, Clock, Tag, Repeat, CheckSquare, Square, AlignLeft, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTagColorClass } from '@/utils/tagUtils';

const TaskDetailView = ({ task, onToggleSubtask }) => {
  if (!task) return null;

  const priorityColors = {
    low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Meta Information Bar */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border/50">
        {task.dueDate && (
          <div className="flex items-center gap-2" title="Due Date">
            <Calendar className="h-4 w-4" />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        )}
        {task.dueTime && (
          <div className="flex items-center gap-2" title="Due Time">
            <Clock className="h-4 w-4" />
            <span>{task.dueTime}</span>
          </div>
        )}
        {task.estimatedDuration && (
          <div className="flex items-center gap-2" title="Duration">
            <span className="font-mono text-xs border rounded px-1">{task.estimatedDuration}m</span>
          </div>
        )}
        {task.repeatFrequency && task.repeatFrequency !== 'none' && (
          <div className="flex items-center gap-2 text-primary" title="Repeats">
            <Repeat className="h-4 w-4" />
            <span className="capitalize">{task.repeatFrequency}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <AlignLeft className="h-4 w-4" />
            <span>Description</span>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pl-6 border-l-2 border-border/50">
            {task.description}
          </div>
        </div>
      )}

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <CheckSquare className="h-4 w-4" />
            <span>Subtasks ({task.subtasks.filter(t => t.isCompleted).length}/{task.subtasks.length})</span>
          </div>
          <div className="grid gap-2 pl-2">
            {task.subtasks.map((subtask) => (
              <div 
                key={subtask.id} 
                className={cn(
                  "flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-muted/50 group",
                  subtask.isCompleted && "opacity-60"
                )}
              >
                <button
                  onClick={() => onToggleSubtask(task.id, subtask.id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                >
                  {subtask.isCompleted ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <span className={cn(
                    "text-sm block leading-tight",
                    subtask.isCompleted && "line-through text-muted-foreground"
                  )}>
                    {subtask.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
                {task.tags.map(tag => (
                <span 
                    key={tag} 
                    className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium border shadow-sm",
                        getTagColorClass(tag)
                    )}
                >
                    {tag}
                </span>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailView;
