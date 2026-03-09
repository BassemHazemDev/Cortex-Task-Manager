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
import { AlertTriangle, Trash2 } from "lucide-react";

/**
 * A reusable confirmation dialog component.
 * Used for confirming destructive actions like delete.
 * Styled to match the app's design system.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive", // 'destructive' | 'default'
  onConfirm,
  onCancel,
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[380px] rounded-xl p-0 overflow-hidden bg-card border border-border/50 shadow-xl">
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {variant === "destructive" && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
            )}
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
            onClick={handleCancel}
            className="sm:min-w-[100px]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className={
              variant === "destructive" 
                ? "bg-red-800 hover:bg-red-800/90 text-white sm:min-w-[100px]" 
                : "sm:min-w-[100px]"
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;

