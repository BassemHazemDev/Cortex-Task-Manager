import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';

export function SortableTodoItem({ todo, toggleTodoComplete, openTodoForm, deleteTodo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(todo.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:bg-accent/30 flex items-center gap-2 ${isDragging ? "shadow-xl ring-2 ring-primary/20" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={(e) => {
              toggleTodoComplete(todo.id);
            }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              todo.isCompleted
                ? "border-[var(--accent-2)] hover:border-[var(--accent-2)]"
                : "border-muted-foreground/30 hover:border-[var(--accent-2)]"
            }`}
            style={{
              background: todo.isCompleted
                ? "var(--accent-2)"
                : "transparent",
            }}
          >
            {todo.isCompleted && (
              <CheckCircle className="h-3 w-3 text-white" />
            )}
          </button>
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => openTodoForm(todo)}
          >
            {(() => {
              const words = todo.title.trim().split(/\s+/);
              if (words.length > 4) {
                return (
                  <p
                    className={`text-sm font-medium ${
                      todo.isCompleted
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                      width: "100%",
                      maxWidth: "100%",
                    }}
                    title={todo.title}
                  >
                    {words.slice(0, 3).join(" ") + " ..."}
                  </p>
                );
              } else {
                return (
                  <p
                    className={`text-sm font-medium ${
                      todo.isCompleted
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                    style={{
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      display: "block",
                      width: "100%",
                      maxWidth: "100%",
                    }}
                    title={todo.title}
                  >
                    {todo.title}
                  </p>
                );
              }
            })()}
            {todo.description && (
              <p 
                className="text-xs text-muted-foreground"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={todo.description}
              >
                {todo.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant={
              todo.priority === "high"
                ? "destructive"
                : todo.priority === "medium"
                ? "default"
                : "secondary"
            }
            className="text-xs min-w-[60px] text-center"
          >
            {todo.priority}
          </Badge>
          <button
            onClick={(e) => {
              deleteTodo(todo.id);
            }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Delete TODO"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
