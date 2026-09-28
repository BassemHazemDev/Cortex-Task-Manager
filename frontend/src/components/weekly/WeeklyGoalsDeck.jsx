import React, { useState } from 'react';
import {
  Target,
  Plus,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
  CheckCircle,
  Clock,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getGoalColor,
  isTodaySaturday,
  isTodayFriday,
  formatWeekRangeDisplay,
} from '../../utils/weeklyGoalsUtils';

const WeeklyGoalsDeck = ({
  weekKey,
  goals = [],
  unassignedCards = [],
  totalHours = 0,
  completedHours = 0,
  percentage = 0,
  totalCardsCount = 0,
  completedCardsCount = 0,
  uncompletedCardsCount = 0,
  onOpenNewGoalModal,
  onOpenRolloverModal,
  onToggleCard,
  onAssignCard,
  onDeleteGoal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOverDeck, setIsDragOverDeck] = useState(false);

  const weekRangeText = formatWeekRangeDisplay(weekKey);
  const isSaturday = isTodaySaturday();
  const isFriday = isTodayFriday();

  // Drag-and-drop into deck to unassign cards
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverDeck(true);
  };

  const handleDragLeave = () => {
    setIsDragOverDeck(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOverDeck(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data && data.startsWith('goalcard:')) {
      const cardId = data.replace('goalcard:', '');
      onAssignCard(cardId, null); // Unassign back to deck
    }
  };

  return (
    <div
      className={`weekly-goals-deck rounded-2xl border transition-all duration-300 shadow-md ${
        isDragOverDeck
          ? 'ring-2 ring-primary border-primary bg-primary/5'
          : 'border-border bg-card/90 backdrop-blur-sm'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Clean, Streamlined Header */}
      <div className="px-4 py-3 md:py-3.5 flex items-center justify-between gap-3 border-b border-border/60">
        {/* Left: Icon, Clean Title & Concise Subtitle */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-foreground tracking-tight truncate">
              Weekly Missions
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {goals.length > 0
                ? `${goals.length} ${goals.length === 1 ? 'mission' : 'missions'} • ${totalHours}h planned`
                : 'Plan weekly goals & partition into daily cards'}
            </p>
          </div>
        </div>

        {/* Right: Compact Progress Capsule & Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Unified Progress Capsule */}
          {totalHours > 0 && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-xs">
              <span className="font-semibold text-foreground text-[11px]">
                {completedHours}/{totalHours} hrs
              </span>
              <div className="w-14 bg-muted-foreground/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-primary">{percentage}%</span>
            </div>
          )}

          {/* New Mission Button */}
          <Button
            size="sm"
            onClick={onOpenNewGoalModal}
            className="rounded-xl px-3.5 h-8 text-xs font-semibold shadow-xs flex items-center space-x-1.5 active:scale-95 transition-transform"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Mission</span>
          </Button>

          {/* Rollover Button */}
          {uncompletedCardsCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenRolloverModal}
              className="rounded-xl px-2.5 h-8 text-xs font-medium flex items-center space-x-1.5 hover:bg-muted/80 transition-all border-border/70"
              title="Review progress and roll over remaining cards to next week"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
              <span className="hidden md:inline">Rollover</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                {uncompletedCardsCount}
              </span>
            </Button>
          )}

          {/* Collapse/Expand Toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-xl w-8 h-8 text-muted-foreground hover:text-foreground"
            title={isCollapsed ? 'Expand Missions' : 'Collapse Missions'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-3.5 md:p-4 space-y-3.5">
          {/* Saturday Planning Prompt Banner */}
          {isSaturday && goals.length === 0 && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Happy Saturday! Welcome to a fresh week.</span>
                  <p className="text-muted-foreground mt-0.5">
                    Map out this week's key missions and partition them into daily work cards.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={onOpenNewGoalModal}
                className="rounded-lg text-xs font-semibold shrink-0"
              >
                Plan Missions
              </Button>
            </div>
          )}

          {/* Friday Review Prompt Banner */}
          {isFriday && uncompletedCardsCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">
                    Friday Wrap-Up: You have {uncompletedCardsCount} unfinished mission cards.
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Complete them today or roll them over into next week with one click.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={onOpenRolloverModal}
                className="rounded-lg text-xs font-semibold shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Review & Rollover
              </Button>
            </div>
          )}

          {/* Available Cards Pool Tray */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">
                  Available Cards
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {unassignedCards.length}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Drag cards to schedule • Double-click to complete
              </span>
            </div>

            {unassignedCards.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
                {goals.length === 0 ? (
                  <div className="space-y-2">
                    <Target className="h-8 w-8 mx-auto text-muted-foreground/60" />
                    <p className="text-xs font-medium text-foreground">No weekly missions defined yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      Click "+ New Mission" above to set this week's goals and break them into draggable cards.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onOpenNewGoalModal}
                      className="mt-1 rounded-xl text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Mission
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    All cards for this week have been assigned to days!
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-2.5 rounded-xl bg-muted/20 border border-border/60">
                {unassignedCards.map((card) => {
                  const theme = getGoalColor(card.colorTheme);
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', `goalcard:${card.id}`);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onToggleCard(card.id);
                      }}
                      className={`group relative flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${
                        theme.bg
                      } ${theme.border} ${
                        card.isCompleted ? 'opacity-60 line-through' : ''
                      }`}
                      title="Drag to a day column • Double-click to toggle complete"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate max-w-[170px]">
                          {card.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                          {card.goalTitle}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-background/80 text-foreground shadow-2xs border border-border/50">
                          {card.hours}h
                        </span>
                        {card.isCompleted && (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Missions Summary Chips */}
          {goals.length > 0 && (
            <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                Missions:
              </span>
              {goals.map((g) => {
                const theme = getGoalColor(g.colorTheme);
                const doneCount = (g.cards || []).filter((c) => c.isCompleted).length;
                const totalCount = (g.cards || []).length;
                return (
                  <div
                    key={g.id}
                    className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-xs font-medium ${theme.bg} ${theme.border}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                    <span className="font-semibold text-foreground truncate max-w-[140px]">
                      {g.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({doneCount}/{totalCount} cards)
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(g.id)}
                      className="opacity-40 hover:opacity-100 hover:text-destructive transition-opacity"
                      title="Delete Mission"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyGoalsDeck;
