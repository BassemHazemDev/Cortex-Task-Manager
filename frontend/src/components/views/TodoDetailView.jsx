import React, { useState, useRef, useEffect } from "react";
import { AlignLeft, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TodoDetailView = ({ todo, onUpdateDescription }) => {
  // State for inline description editing - must be before early returns
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState("");
  const descriptionRef = useRef(null);

  // Focus textarea when editing description starts
  useEffect(() => {
    if (isEditingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEditingDescription]);

  // Early return after hooks
  if (!todo) return null;

  // Handle double click to start editing description
  const handleDescriptionDoubleClick = () => {
    if (!onUpdateDescription) return;
    setIsEditingDescription(true);
    setEditingDescription(todo.description || "");
  };

  // Save the edited description
  const handleDescriptionSave = () => {
    if (onUpdateDescription && editingDescription !== todo.description) {
      onUpdateDescription(todo.id, { description: editingDescription });
    }
    setIsEditingDescription(false);
    setEditingDescription("");
  };

  // Handle key down for description (Ctrl+Enter to save, Escape to cancel)
  const handleDescriptionKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === "Escape") {
      setIsEditingDescription(false);
      setEditingDescription("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Quick Todo
          </h3>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium border capitalized",
              todo.priority === "high"
                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                : todo.priority === "medium"
                ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {todo.priority} priority
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlignLeft className="h-4 w-4" />
            <span>Details</span>
            {onUpdateDescription && !isEditingDescription && (
              <span className="text-xs text-muted-foreground font-normal">
                (double-click to edit)
              </span>
            )}
          </div>
          <div
            className={cn(
              "text-sm whitespace-pre-wrap leading-relaxed rounded transition-colors",
              isEditingDescription
                ? "bg-muted/80 p-2"
                : "text-muted-foreground",
              onUpdateDescription &&
                !isEditingDescription &&
                "cursor-pointer hover:bg-muted/30 p-2 -m-2"
            )}
            onDoubleClick={handleDescriptionDoubleClick}
            title={
              onUpdateDescription && !isEditingDescription
                ? "Double-click to edit"
                : undefined
            }
          >
            {isEditingDescription ? (
              <Textarea
                ref={descriptionRef}
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                onBlur={handleDescriptionSave}
                className="min-h-[100px] text-sm resize-none"
                placeholder="Enter description..."
              />
            ) : (
              todo.description || (
                <span className="italic text-muted-foreground/60">
                  No additional details provided. Double-click to add.
                </span>
              )
            )}
          </div>
          {isEditingDescription && (
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to save, Escape to cancel
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoDetailView;
