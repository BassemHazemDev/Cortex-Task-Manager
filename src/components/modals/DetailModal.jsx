import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import TaskDetailView from "../views/TaskDetailView";
import TodoDetailView from "../views/TodoDetailView";
import { cn } from "@/lib/utils";

/**
 * A generic modal for viewing details of an item (Task or Todo).
 * Allows switching to Edit mode.
 */
const DetailModal = ({
  isOpen,
  onClose,
  item,
  type = "task", // 'task' | 'todo'
  onEdit,
  onDelete,
  onToggleSubtask, // Specific to tasks
  onUpdateSubtask, // For inline subtask editing
  onUpdateDescription, // For inline description editing
}) => {
  const isTask = type === "task";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset confirmation state when modal opens/closes or item changes
  React.useEffect(() => {
    if (isOpen) setShowDeleteConfirm(false);
  }, [isOpen, item]);

  // Early return after hooks
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto gap-0 p-0 overflow-hidden bg-card mx-auto">
        {/* Header Section */}
        <div className="px-6 py-4 border-b bg-muted/40 flex items-start gap-4 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex-1 space-y-1 pt-1">
            <DialogTitle className="text-xl font-bold leading-tight break-words pr-8">
              {item.title}
            </DialogTitle>
            {isTask && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                    item.priority === "high"
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900"
                      : item.priority === "medium"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900"
                      : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900"
                  )}
                >
                  {item.priority}
                </span>
                {item.type && (
                  <span className="text-xs text-muted-foreground capitalize">
                    • {item.type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {isTask ? (
            <TaskDetailView
              task={item}
              onToggleSubtask={onToggleSubtask}
              onUpdateSubtask={onUpdateSubtask}
              onUpdateDescription={onUpdateDescription}
            />
          ) : (
            <TodoDetailView
              todo={item}
              onUpdateDescription={onUpdateDescription}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-muted/20 border-t flex justify-between items-center gap-4">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full justify-end animate-in fade-in slide-in-from-right-4 duration-200">
              <span className="text-sm font-medium text-destructive mr-2">
                Are you sure?
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(item.id);
                  onClose();
                }}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-700 hover:bg-red-800 text-white opacity-90 hover:opacity-100 transition-all shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}

          {!showDeleteConfirm && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onEdit(item)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailModal;
