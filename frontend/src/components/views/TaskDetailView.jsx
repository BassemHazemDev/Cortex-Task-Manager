import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  Tag,
  Repeat,
  CheckSquare,
  Square,
  AlignLeft,
  Flag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getTagColorClass } from "@/utils/tagUtils";

const TaskDetailView = ({
  task,
  onToggleSubtask,
  onUpdateSubtask,
  onUpdateDescription,
}) => {
  // State for inline subtask editing - must be before any early returns to follow React hooks rules
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const inputRef = useRef(null);

  // State for inline description editing
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState("");
  const descriptionRef = useRef(null);

  // Focus input when editing subtask starts
  useEffect(() => {
    if (editingSubtaskId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSubtaskId]);

  // Focus textarea when editing description starts
  useEffect(() => {
    if (isEditingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEditingDescription]);

  // Early return after hooks
  if (!task) return null;

  // Handle double click to start editing subtask
  const handleDoubleClick = (subtask) => {
    if (!onUpdateSubtask) return; // Only allow editing if handler is provided
    setEditingSubtaskId(subtask.id);
    setEditingText(subtask.title);
  };

  // Save the edited subtask
  const handleSave = () => {
    if (editingSubtaskId && editingText.trim() && onUpdateSubtask) {
      onUpdateSubtask(task.id, editingSubtaskId, { title: editingText.trim() });
    }
    setEditingSubtaskId(null);
    setEditingText("");
  };

  // Handle key down for Enter to save, Escape to cancel (subtask)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditingSubtaskId(null);
      setEditingText("");
    }
  };

  // Handle double click to start editing description
  const handleDescriptionDoubleClick = () => {
    if (!onUpdateDescription) return;
    setIsEditingDescription(true);
    setEditingDescription(task.description || "");
  };

  // Save the edited description
  const handleDescriptionSave = () => {
    if (onUpdateDescription && editingDescription !== task.description) {
      onUpdateDescription(task.id, { description: editingDescription });
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
      {/* Meta Information Bar */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border/50">
        {task.dueDate && (
          <div className="flex items-center gap-2" title="Due Date">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
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
            <span className="font-mono text-xs border rounded px-1">
              {task.estimatedDuration}m
            </span>
          </div>
        )}
        {task.repeatFrequency && task.repeatFrequency !== "none" && (
          <div className="flex items-center gap-2 text-primary" title="Repeats">
            <Repeat className="h-4 w-4" />
            <span className="capitalize">{task.repeatFrequency}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {(task.description || onUpdateDescription) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <AlignLeft className="h-4 w-4" />
            <span>Description</span>
            {onUpdateDescription && !isEditingDescription && (
              <span className="text-xs text-muted-foreground font-normal">
                (double-click to edit)
              </span>
            )}
          </div>
          <div
            className={cn(
              "text-sm whitespace-pre-wrap leading-relaxed pl-6 border-l-2 border-border/50 rounded-r transition-colors",
              isEditingDescription
                ? "bg-muted/80 p-2"
                : "text-muted-foreground",
              onUpdateDescription &&
                !isEditingDescription &&
                "cursor-pointer hover:bg-muted/30"
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
              task.description || (
                <span className="italic text-muted-foreground/60">
                  No description. Double-click to add.
                </span>
              )
            )}
          </div>
          {isEditingDescription && (
            <p className="text-xs text-muted-foreground pl-6">
              Press Ctrl+Enter to save, Escape to cancel
            </p>
          )}
        </div>
      )}

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <CheckSquare className="h-4 w-4" />
            <span>
              Subtasks ({task.subtasks.filter((t) => t.isCompleted).length}/
              {task.subtasks.length})
            </span>
          </div>
          <div className="grid gap-2 pl-2">
            {task.subtasks.map((subtask) => {
              const isEditing = editingSubtaskId === subtask.id;

              return (
                <div
                  key={subtask.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-md transition-colors group",
                    isEditing
                      ? "bg-muted/80" // Darker background when editing
                      : "hover:bg-muted/50",
                    subtask.isCompleted && !isEditing && "opacity-60"
                  )}
                  onDoubleClick={() => handleDoubleClick(subtask)}
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
                    {isEditing ? (
                      <Input
                        ref={inputRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className="h-7 text-sm"
                        placeholder="Subtask title..."
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-sm block leading-tight cursor-pointer",
                          subtask.isCompleted &&
                            "line-through text-muted-foreground",
                          onUpdateSubtask && "hover:text-primary"
                        )}
                        title={
                          onUpdateSubtask ? "Double-click to edit" : undefined
                        }
                      >
                        {subtask.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
            {task.tags.map((tag) => (
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
