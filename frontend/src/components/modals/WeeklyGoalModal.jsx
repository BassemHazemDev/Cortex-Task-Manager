import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Target, Clock, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { GOAL_COLORS, generatePartitionCards } from '../../utils/weeklyGoalsUtils';

const WeeklyGoalModal = ({ isOpen, onClose, onSave, weekRangeText }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalHours, setTotalHours] = useState(3);
  const [partitionType, setPartitionType] = useState('hours'); // 'hours' | 'parts'
  const [partitionValue, setPartitionValue] = useState(1); // 1h per card or 3 parts
  const [colorTheme, setColorTheme] = useState('indigo');
  const [error, setError] = useState('');

  // Reset form when modal opens
  const handleOpenChange = (open) => {
    if (!open) {
      onClose();
      setError('');
    }
  };

  // Preview generated cards live
  const previewCards = useMemo(() => {
    if (!title.trim()) {
      return generatePartitionCards({
        title: 'Sample Mission',
        description,
        totalHours: Number(totalHours) || 1,
        partitionType,
        partitionValue: Number(partitionValue) || 1,
        goalId: 'preview',
      });
    }
    return generatePartitionCards({
      title: title.trim(),
      description,
      totalHours: Number(totalHours) || 1,
      partitionType,
      partitionValue: Number(partitionValue) || 1,
      goalId: 'preview',
    });
  }, [title, description, totalHours, partitionType, partitionValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a mission title');
      return;
    }
    if (Number(totalHours) <= 0) {
      setError('Total hours must be greater than 0');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      totalHours: Number(totalHours),
      partitionType,
      partitionValue: Number(partitionValue),
      colorTheme,
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setTotalHours(3);
    setPartitionType('hours');
    setPartitionValue(1);
    setColorTheme('indigo');
    setError('');
    onClose();
  };

  const selectedTheme = GOAL_COLORS.find((c) => c.id === colorTheme) || GOAL_COLORS[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-lg rounded-2xl gap-5 p-6 bg-card border border-border shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-primary mb-1">
            <div className="p-2 rounded-xl bg-primary/10">
              <Target className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Weekly Mission Planner
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Add Weekly Goal
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {weekRangeText ? `For week: ${weekRangeText}` : 'Define goals and break them into draggable daily cards'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/15 text-destructive text-sm border border-destructive/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mission Title */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Mission Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="e.g., Finalize Q3 Product Roadmaps & Architecture"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder="Key deliverables, focus areas, or references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Work Hours & Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-foreground">
                Total Work Hours Required
              </label>
              <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                {totalHours} hrs total
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="80"
                className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={totalHours}
                onChange={(e) => setTotalHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
              />
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3, 5, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setTotalHours(h)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                      Number(totalHours) === h
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                        : 'border-input hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Partitioning Strategy */}
          <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Card Partitioning Strategy
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Creates {previewCards.length} cards
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPartitionType('hours');
                  setPartitionValue(1);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                  partitionType === 'hours'
                    ? 'border-primary bg-primary/15 text-primary shadow-xs'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <div className="font-semibold">By Hours per Card</div>
                <div className="text-[10px] opacity-80">e.g., 1h cards, 2h cards</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPartitionType('parts');
                  setPartitionValue(Math.max(2, Math.min(5, Math.ceil(totalHours / 1))));
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                  partitionType === 'parts'
                    ? 'border-primary bg-primary/15 text-primary shadow-xs'
                    : 'border-input hover:bg-muted text-muted-foreground'
                }`}
              >
                <div className="font-semibold">By Number of Parts</div>
                <div className="text-[10px] opacity-80">e.g., Split into 3 equal cards</div>
              </button>
            </div>

            {/* Partition Value Selector */}
            {partitionType === 'hours' ? (
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs text-muted-foreground shrink-0">Card Duration:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[0.5, 1, 1.5, 2, 3].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPartitionValue(val)}
                      className={`px-2 py-1 text-xs rounded-md border transition-all ${
                        partitionValue === val
                          ? 'bg-primary text-primary-foreground font-semibold border-primary'
                          : 'border-input hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {val}h/card
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs text-muted-foreground shrink-0">Split Into:</span>
                <div className="flex space-x-1.5">
                  {[2, 3, 4, 5, 6].map((parts) => (
                    <button
                      key={parts}
                      type="button"
                      onClick={() => setPartitionValue(parts)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        partitionValue === parts
                          ? 'bg-primary text-primary-foreground font-semibold border-primary'
                          : 'border-input hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {parts} parts
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Mission Color Accent
            </label>
            <div className="flex items-center space-x-3">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setColorTheme(color.id)}
                  title={color.name}
                  className={`w-7 h-7 rounded-full transition-all duration-200 relative flex items-center justify-center ${
                    colorTheme === color.id
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.primary }}
                >
                  {colorTheme === color.id && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              ))}
              <span className="text-xs font-medium text-muted-foreground ml-1">
                {selectedTheme.name}
              </span>
            </div>
          </div>

          {/* Live Preview of Partitioned Cards */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Live Generated Cards Preview:
              </span>
              <span className="text-[11px]">
                {previewCards.length} cards will be added to this week
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-background border border-border">
              {previewCards.map((card, i) => (
                <div
                  key={i}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium shadow-xs flex items-center space-x-2 ${selectedTheme.bg} ${selectedTheme.border} ${selectedTheme.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedTheme.dot}`} />
                  <span className="truncate max-w-[150px]">{card.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-background/60 shadow-2xs">
                    {card.hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl px-5 font-semibold shadow-md active:scale-95 transition-transform"
            >
              Create Weekly Mission
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyGoalModal;
