import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

/**
 * A modal component for confirming discarding unsaved changes.
 * Styled to match the app's design system.
 */
export function UnsavedChangesModal({
  open,
  onOpenChange,
  title = "Unsaved Changes",
  description = "You have unsaved changes. Are you sure you want to discard them?",
  discardLabel = "Discard Changes",
  keepLabel = "Keep Editing",
  onDiscard,
  onKeepEditing,
}) {
  const handleDiscard = () => {
    onDiscard?.();
    onOpenChange(false);
  };

  const handleKeepEditing = () => {
    onKeepEditing?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[380px] rounded-xl p-0 overflow-hidden bg-card border border-border/50 shadow-xl">
        {/* Header with warning icon */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-800" />
            </div>
            <div className="flex-1 space-y-1.5">
              <DialogTitle className="text-lg font-semibold leading-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleKeepEditing}
            className="sm:min-w-[100px]"
          >
            {keepLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDiscard}
            className="bg-red-800 hover:bg-red-700 text-white sm:min-w-[100px]"
          >
            {discardLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UnsavedChangesModal;
