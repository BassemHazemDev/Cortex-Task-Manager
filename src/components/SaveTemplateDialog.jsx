import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SaveTemplateDialog({ open, onOpenChange, onSave, defaultName = '' }) {
  const [name, setName] = useState(defaultName);
  const [descriptionType, setDescriptionType] = useState('text');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      descriptionType
    });
    onOpenChange(false);
    setName('');
    setDescriptionType('text');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Template Name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Desc. Type
            </Label>
            <Select value={descriptionType} onValueChange={setDescriptionType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Free Text</SelectItem>
                <SelectItem value="list">List (Bullet Points)</SelectItem>
                <SelectItem value="chunks">Structured Chunks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
