import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CheckCircle, Trash2, GripVertical, Edit, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import haptics from '../utils/haptics';

export function SortableTodoItem({ todo, toggleTodoComplete, openTodoForm, onEditTodo, deleteTodo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(todo.id) });

  // Haptic feedback when dragging starts
  useEffect(() => {
    if (isDragging) {
      haptics.dragStart();
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative',
  };

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-3 transition-all duration-300 hover:shadow-md ${isDragging ? "shadow-xl ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Left column: Checkbox + Drag handle stacked vertically */}
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              haptics.success();
              toggleTodoComplete(todo.id);
            }}
            className={`rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              todo.isCompleted
                ? "border-[var(--accent-2)] hover:border-[var(--accent-2)]"
                : "border-muted-foreground/30 hover:border-[var(--accent-2)]"
            }`}
            style={{
              width: "18px",
              height: "18px",
              minWidth: "18px",
              minHeight: "18px",
              padding: 0,
              background: todo.isCompleted
                ? "var(--accent-2)"
                : "transparent",
            }}
          >
            {todo.isCompleted && (
              <CheckCircle className="h-3 w-3 text-white" />
            )}
          </motion.button>
          
          {/* Drag handle below checkbox */}
          <button
            {...attributes}
            {...listeners}
            className="touch-none text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors hover:bg-muted/50"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Middle: Content area */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => openTodoForm(todo)}
        >
          {(() => {
            const words = todo.title.trim().split(/\s+/);
            if (words.length > 4) {
              return (
                <p
                  className={`text-sm font-medium leading-tight ${
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
                  className={`text-sm font-medium leading-tight ${
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
              className="text-xs text-muted-foreground mt-0.5"
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

        {/* Right: Priority badge + Kebab menu */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge
            variant={
              todo.priority === "high"
                ? "destructive"
                : todo.priority === "medium"
                ? "default"
                : "secondary"
            }
            className="text-xs px-1.5 py-0 h-5"
          >
            {todo.priority}
          </Badge>
          
          {/* Kebab menu button */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
                aria-label="Todo actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                if (onEditTodo) onEditTodo(todo);
                else openTodoForm(todo);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit TODO
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                haptics.success();
                toggleTodoComplete(todo.id);
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {todo.isCompleted ? 'Mark Pending' : 'Complete'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Delete TODO"
            description={`Are you sure you want to delete "${todo.title}"? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="destructive"
            onConfirm={() => deleteTodo(todo.id)}
          />
        </div>
      </div>
    </motion.div>
  );
}
