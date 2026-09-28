import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, RotateCcw, Calendar, Check, AlertCircle } from 'lucide-react';
import { getGoalColor, getNextWeekKey, formatWeekRangeDisplay } from '../../utils/weeklyGoalsUtils';

const FridayRolloverModal = ({
  isOpen,
  onClose,
  weekKey,
  goals,
  uncompletedCardsCount,
  completedCardsCount,
  totalHours,
  completedHours,
  onToggleCard,
  onRollover,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const nextWeekKey = weekKey ? getNextWeekKey(weekKey) : '';
  const nextWeekRangeText = nextWeekKey ? formatWeekRangeDisplay(nextWeekKey) : '';

  // Get all uncompleted cards across all goals
  const uncompletedCards = [];
  for (const goal of goals || []) {
    for (const card of goal.cards || []) {
      if (!card.isCompleted) {
        uncompletedCards.push({
          ...card,
          goalTitle: goal.title,
          colorTheme: goal.colorTheme,
        });
      }
    }
  }

  const handleRolloverConfirm = async () => {
    setIsProcessing(true);
    try {
      await onRollover();
      onClose();
    } catch (err) {
      console.error('Error during rollover:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-lg rounded-2xl gap-5 p-6 bg-card border border-border shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-primary mb-1">
            <div className="p-2 rounded-xl bg-primary/10">
              <RotateCcw className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              End-of-Week Review & Rollover
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Wrap Up Your Week
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review completed missions for this week and send remaining unfinished cards to the upcoming week.
          </DialogDescription>
        </DialogHeader>

        {/* Progress summary stats */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Hours Completed</span>
            <div className="text-xl font-black text-foreground flex items-baseline gap-1">
              <span className="text-emerald-500">{completedHours}h</span>
              <span className="text-xs text-muted-foreground font-normal">/ {totalHours}h</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Cards Remaining</span>
            <div className="text-xl font-black text-foreground">
              {uncompletedCards.length}
            </div>
          </div>
        </div>

        {/* Uncompleted cards list */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Remaining Unfinished Cards ({uncompletedCards.length}):
            </span>
            <span className="text-muted-foreground text-[11px]">
              Click checkmark to complete now
            </span>
          </div>

          {uncompletedCards.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-sm">All weekly missions accomplished!</p>
              <p className="text-xs opacity-80 mt-1">
                Outstanding job! You've completed every card planned for this week.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {uncompletedCards.map((card) => {
                const theme = getGoalColor(card.colorTheme);
                return (
                  <div
                    key={card.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${theme.bg} ${theme.border}`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleCard(card.id)}
                        className="w-5 h-5 rounded-full border-2 border-primary/50 hover:bg-primary/20 flex items-center justify-center shrink-0 transition-all"
                        title="Mark completed"
                      >
                        <Check className="h-3 w-3 opacity-0 hover:opacity-100 text-primary" />
                      </button>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate max-w-[240px]">
                          {card.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {card.goalTitle}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/80 shadow-2xs shrink-0">
                      {card.hours}h
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rollover destination banner */}
        {uncompletedCards.length > 0 && (
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-foreground">Target Next Week:</span>{' '}
              <span className="text-primary font-medium">{nextWeekRangeText}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Rolled cards will appear in next week's available cards deck ready to be scheduled.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Close
          </Button>
          {uncompletedCards.length > 0 && (
            <Button
              onClick={handleRolloverConfirm}
              disabled={isProcessing}
              className="rounded-xl px-5 font-semibold shadow-md active:scale-95 transition-transform bg-primary text-primary-foreground flex items-center space-x-1.5"
            >
              <span>Send {uncompletedCards.length} Cards to Next Week</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FridayRolloverModal;
