
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const ShortcutsModal = ({ open, onOpenChange }) => {
  const shortcuts = [
    { key: 'Alt + N', description: 'Create New Task' },
    { key: 'Alt + T', description: 'Create New TODO' },
    { key: 'Alt + 1', description: 'Calendar View' },
    { key: 'Alt + 2', description: 'Task List View' },
    { key: 'Alt + 3', description: 'Smart Scheduler View' },
    { key: 'Alt + D', description: 'Toggle Dark Mode' },
    { key: '?', description: 'Show Keyboard Shortcuts' },
    { key: 'Esc', description: 'Close Modals' },
    { key: 'Ctrl + Enter', description: 'Save Task/TODO (in form)' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master your productivity with these shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
             {shortcuts.map((s, i) => (
               <div key={i} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                 <span className="text-sm font-medium">{s.description}</span>
                 <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                   {s.key}
                 </kbd>
               </div>
             ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsModal;
