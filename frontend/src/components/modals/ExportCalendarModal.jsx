import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Image } from "lucide-react";

const ExportCalendarModal = ({ isOpen, onClose, onExportPDF, onExportJPEG }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm rounded-xl gap-4 p-6 bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Export Calendar</DialogTitle>
          <DialogDescription>
            Choose a format to export your calendar view.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <Button 
            className="w-full justify-start h-12 text-base" 
            variant="outline" 
            onClick={() => {
              onExportPDF();
              onClose();
            }}
          >
            <FileDown className="mr-3 h-5 w-5 text-red-500" />
            <div className="flex flex-col items-start">
              <span className="font-semibold">Export as PDF</span>
              <span className="text-xs text-muted-foreground font-normal">Best for printing</span>
            </div>
          </Button>

          <Button 
            className="w-full justify-start h-12 text-base" 
            variant="outline"
            onClick={() => {
              onExportJPEG();
              onClose();
            }}
          >
            <Image className="mr-3 h-5 w-5 text-blue-500" />
            <div className="flex flex-col items-start">
              <span className="font-semibold">Export as JPEG</span>
              <span className="text-xs text-muted-foreground font-normal">Best for sharing</span>
            </div>
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportCalendarModal;
