import React from "react";
import { CheckSquare, Square, Trash2, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

export function SubtaskList({
  subtasks = [],
  onToggle,
  onDelete,
  onUpdate,
  readOnly = false,
}) {
  if (!subtasks.length) return null;

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className={cn(
            "flex items-center gap-2 group p-2 rounded-md transition-colors",
            !readOnly && "hover:bg-muted/50"
          )}
        >
          {/* Checkbox / Status */}
          <button
            type="button"
            onClick={() => onToggle && onToggle(subtask.id)}
            disabled={readOnly && !onToggle}
            className={cn(
              "flex-shrink-0 text-muted-foreground transition-colors",
              subtask.isCompleted ? "text-primary" : "hover:text-primary"
            )}
          >
            {subtask.isCompleted ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {readOnly || !onUpdate ? (
              <span
                className={cn(
                  "text-sm block truncate",
                  subtask.isCompleted && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>
            ) : (
              <Input
                value={subtask.title}
                onChange={(e) =>
                  onUpdate(subtask.id, { title: e.target.value })
                }
                className="h-7 text-sm bg-transparent border-transparent hover:border-input focus:border-input px-1"
              />
            )}
          </div>

          {/* Actions */}
          {!readOnly && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(subtask.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
