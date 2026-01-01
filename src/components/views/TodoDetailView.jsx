import React from 'react';
import { AlignLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TodoDetailView = ({ todo }) => {
  if (!todo) return null;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quick Todo</h3>
            <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium border capitalized",
                todo.priority === 'high' ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" :
                todo.priority === 'medium' ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400" :
                "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
            )}>
                {todo.priority} priority
            </span>
        </div>
        
        {todo.description ? (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlignLeft className="h-4 w-4" />
                    <span>Details</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {todo.description}
                </p>
            </div>
        ) : (
            <div className="text-center py-4 text-muted-foreground/60 italic text-sm">
                No additional details provided.
            </div>
        )}
      </div>
    </div>
  );
};

export default TodoDetailView;
