import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useDateRefresh } from '../hooks/useDateRefresh';
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { isOverdue, formatTime12 } from '../utils/dateUtils';
import { playCompleteSound } from '../utils/audioUtils';

// UI component mocks for demonstration; replace with your actual UI library imports in production.
const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
const Card = ({ children, ...props }) => <div {...props}>{children}</div>;
const CardHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
const CardTitle = ({ children, ...props }) => <h3 {...props}>{children}</h3>;
const CardContent = ({ children, ...props }) => <div {...props}>{children}</div>;
const Badge = ({ children, variant, ...props }) => <span data-variant={variant} {...props}>{children}</span>;


const CalendarView = ({ selectedDate, onDateSelect, tasks, onTaskClick, onToggleComplete, expanded, onTaskDrop, onCreateDate }) => {
  // Use the date refresh hook to handle midnight transitions
  const { now } = useDateRefresh();
  
  // View mode state: 'month', 'week', '3day'
  const [viewMode, setViewMode] = useState('month');
  
  // Drag-and-drop state for dragging task
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  // Tracks the current theme mode (dark or light) for initial render reliability
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Observes theme changes on the document root to update dark mode state
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Adjust for Saturday-first week: Saturday=0, Sunday=1, Monday=2, etc.
    const startingDayOfWeek = (firstDay.getDay() + 1) % 7;

    const days = [];
    
  // Adds empty cells to align the first day of the month with the correct weekday
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
  // Populates the calendar grid with all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Drag event handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(taskId));
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
  // Converts a Date object to a local date string for accurate task filtering
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return tasks.filter(task => task.dueDate === dateStr);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    if (viewMode === 'month') {
      newMonth.setMonth(currentMonth.getMonth() + direction);
    } else if (viewMode === 'week') {
      newMonth.setDate(currentMonth.getDate() + (direction * 7));
    } else if (viewMode === '3day') {
      newMonth.setDate(currentMonth.getDate() + (direction * 3));
    }
    setCurrentMonth(newMonth);
  };

  // Get days for weekly view (7 days starting from Monday of the week containing currentMonth)
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    // Adjust to Monday: Sunday=0, Monday=1, Tuesday=2, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + daysToMonday);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get days for 3-day view (current date and next 2 days)
  const get3Days = (date) => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const day = new Date(date);
      day.setDate(date.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === now.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date) => {
    if (!date) return "Select a date";
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };



  // Get appropriate days based on view mode
  const getDaysForView = () => {
    if (viewMode === 'month') {
      return getDaysInMonth(currentMonth);
    } else if (viewMode === 'week') {
      return getWeekDays(currentMonth);
    } else if (viewMode === '3day') {
      return get3Days(currentMonth);
    }
    return [];
  };

  const days = getDaysForView();
  const dayNames = viewMode === 'month' 
    ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedDayTasks = getTasksForDate(selectedDate);

  // Get header title based on view mode
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(currentMonth);
      const startDate = weekDays[0];
      const endDate = weekDays[6];
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Week of ${startDate.getDate()}`;
      } else {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else if (viewMode === '3day') {
      const threeDays = get3Days(currentMonth);
      const startDate = threeDays[0];
      const endDate = threeDays[2];
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${startDate.getDate()}-${endDate.getDate()}`;
      } else {
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }
  };

  return (
    <div className="space-y-6 p-4" style={{ background: 'var(--card)', color: 'var(--card-foreground)', minHeight: '100vh', maxWidth: '100%', overflow: 'hidden' }}>
  {/* Main calendar grid displaying the current view and navigation controls */}
      <Card style={{ background: 'var(--background)', color: 'var(--foreground)', maxWidth: '100%' }} className="rounded-xl shadow-md">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {getHeaderTitle()}
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                className="p-2 rounded-md"
                style={{ background: 'var(--card)', color: 'var(--foreground)' }}
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-5 w-5" style={{ color: 'var(--foreground)' }} />
              </Button>
              <Button
                className="p-2 rounded-md"
                style={{ background: 'var(--card)', color: 'var(--foreground)' }}
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-5 w-5" style={{ color: 'var(--foreground)' }} />
              </Button>
            </div>
          </div>
          {/* View mode selector */}
          <div className="flex space-x-2 mt-4 justify-center">
            <Button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'shadow-md' : ''}`}
              style={{ 
                background: viewMode === 'month' ? 'var(--primary)' : 'var(--muted)', 
                color: viewMode === 'month' ? 'var(--primary-foreground)' : 'var(--muted-foreground)' 
              }}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'week' ? 'shadow-md' : ''}`}
              style={{ 
                background: viewMode === 'week' ? 'var(--primary)' : 'var(--muted)', 
                color: viewMode === 'week' ? 'var(--primary-foreground)' : 'var(--muted-foreground)' 
              }}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === '3day' ? 'shadow-md' : ''}`}
              style={{ 
                background: viewMode === '3day' ? 'var(--primary)' : 'var(--muted)', 
                color: viewMode === '3day' ? 'var(--primary-foreground)' : 'var(--muted-foreground)' 
              }}
              onClick={() => setViewMode('3day')}
            >
              3 Days
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {/* Header row displaying day names */}
          <div className={`grid gap-1 mb-2 ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-3'}`} style={{ maxWidth: '100%' }}>
            {(viewMode === 'month' || viewMode === 'week' ? dayNames : days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }))).map((day, index) => (
              <div key={`${day}-${index}`} className="p-2 text-center text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {viewMode === '3day' ? `${day} ${days[index].getDate()}` : day}
              </div>
            ))}
          </div>
          {/* Calendar days grid: each cell represents a day and displays tasks */}
          <div className={`grid gap-1 ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-3'}`} style={{ maxWidth: '100%' }}>
            {days.map((date, index) => {
              if (!date && viewMode === 'month') return <div key={index} />;
              if (!date) return null;

              let dayTasks = getTasksForDate(date);
              // Sort tasks by dueTime if present
              dayTasks = [...dayTasks].sort((a, b) => {
                if (!a.dueTime) return 1;
                if (!b.dueTime) return -1;
                return a.dueTime.localeCompare(b.dueTime);
              });
              // const hasHighPriority = dayTasks.some(task => task.priority === 'high' && !task.isCompleted);

              // Dynamically sets background and text color for each day cell based on state (today, selected, high priority)
              let dayBg = 'var(--card)';
              let dayBorder = 'var(--border)';
              let dayText = 'var(--foreground)';
              if (isToday(date)) {
                dayBg = isDark ? 'var(--primary)' : '#e0f2fe';
                dayBorder = isDark ? 'var(--primary)' : '#38bdf8';
                dayText = isDark ? 'var(--primary-foreground)' : '#0c4a6e';
              } 
              else if (isSelected(date)) {
                dayBg = isDark ? 'var(--accent)' : '#bae6fd';
                dayBorder = isDark ? 'var(--accent)' : '#38bdf8';
                dayText = isDark ? 'var(--accent-foreground)' : '#0c4a6e';
              }
              // Adjust cell height based on view mode
              const getCellHeight = () => {
                if (viewMode === 'month') {
                  return expanded ? 'min-h-[180px]' : 'min-h-[140px]';
                } else if (viewMode === 'week') {
                  return expanded ? 'min-h-[250px]' : 'min-h-[200px]';
                } else if (viewMode === '3day') {
                  return expanded ? 'min-h-[300px]' : 'min-h-[250px]';
                }
                return 'min-h-[140px]';
              };

              return (
                <div
                  key={`${date.toISOString()}-${index}`}
                  className={`border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 calendar-card ${getCellHeight()} p-4`}
                  style={{ background: dayBg, borderColor: dayBorder, color: dayText, minWidth: 0, overflow: 'hidden' }}
                  onClick={() => onDateSelect(date)}
                  onDoubleClick={(e) => {
                    // Prevent the parent's click handler from toggling selection twice
                    e.stopPropagation();
                    // Preferred: notify parent that user wants to create a new task for this date
                    if (typeof onCreateDate === 'function') {
                      onCreateDate(date);
                      return;
                    }
                    // Backwards-compatibility: if no onCreateDate provided, try calling onTaskClick with isNew option
                    if (typeof onTaskClick === 'function') {
                      try {
                        onTaskClick(date, { isNew: true });
                        return;
                      } catch (err) {
                        console.warn('onTaskClick date create failed, falling back to onDateSelect:', err);
                      }
                    }
                    // Final fallback: just select the date
                    onDateSelect(date);
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedTaskId = e.dataTransfer.getData("text/plain");
                    if (droppedTaskId) {
                      // Pass to parent for conflict logic
                      if (typeof onTaskDrop === 'function') {
                        onTaskDrop(Number(droppedTaskId), date);
                      }
                    }
                  }}
                >
                  <div className="text-sm font-semibold text-right mb-1" style={{ color: dayText }}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1 calendar-card-content" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    {(() => {
                      // In month view, always show all tasks
                      if (viewMode === 'month') {
                        return dayTasks;
                      }
                      // In week/3day view, keep previous logic
                      const maxTasks = viewMode === 'week'
                        ? (expanded ? dayTasks.length : 4)
                        : dayTasks.length; // 3day shows all tasks
                      return expanded ? dayTasks : dayTasks.slice(0, maxTasks);
                    })().map(task => {
                      // Renders each task in the day cell with appropriate color and click handler
                      let bg = task.priority === 'medium'
                        ? 'var(--accent)'
                        : task.priority === 'high'
                          ? 'var(--accent-2)'
                          : (task.isCompleted ? 'var(--accent-2)' : 'var(--muted)');
                      let color = task.priority === 'medium' || task.priority === 'high'
                        ? 'var(--accent-foreground)'
                        : (task.isCompleted ? 'var(--success-foreground, #fff)' : 'var(--foreground)');
                      let opacity = 1;
                      if (isOverdue(task, now)) {
                        bg = isDark ? '#7f1d1d' : '#fee2e2';
                        color = isDark ? '#fee2e2' : '#7f1d1d';
                        opacity = isDark ? 0.9 : 1;
                      }
                      return (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.03] hover:shadow-lg hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]`}
                          style={{ 
                            background: bg, 
                            color, 
                            textDecoration: task.isCompleted ? 'line-through' : 'none', 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: expanded ? '0.15rem' : '0', 
                            flexDirection: expanded && task.title && task.title.length > 18 ? 'column' : 'row', 
                            opacity: draggedTaskId === task.id ? 0.5 : opacity, 
                            maxWidth: '100%', 
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <span style={{ 
                            wordBreak: 'break-word', 
                            whiteSpace: 'normal', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            display: 'block'
                          }}>{task.title}</span>
                          {expanded && task.dueTime && (
                            <span style={{ fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.95em', marginLeft: expanded && task.title && task.title.length > 18 ? 0 : '0.25rem', marginTop: expanded && task.title && task.title.length > 18 ? '2px' : 0 }}>
                              {formatTime12(task.dueTime)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {/* In month view, always show all tasks, so no '+N more' indicator */}
                    {(() => {
                      if (viewMode === 'month') return null;
                      const maxTasks = viewMode === 'week' ? 4 : dayTasks.length;
                      const showMore = !expanded && dayTasks.length > maxTasks && viewMode !== '3day';
                      if (showMore) {
                        return (
                          <div className="text-xs text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            +{dayTasks.length - maxTasks} more
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

  {/* Details card for the currently selected date, showing tasks and progress */}
      {selectedDate && (
        <Card style={{ background: 'var(--background)', color: 'var(--foreground)', maxWidth: '100%' }} className="rounded-xl shadow-md">
          <CardHeader className="p-4 border-b">
            <CardTitle className="flex items-center space-x-2 text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              <Clock className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <span>{formatDate(selectedDate)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Displays a progress bar for task completion on the selected day */}
            {selectedDayTasks.length > 0 && (
              <div className="mb-4">
                {(() => {
                  const completed = selectedDayTasks.filter(t => t.isCompleted).length;
                  const percent = Math.round((completed / selectedDayTasks.length) * 100);
                  return (
                    <div style={{ width: '80%', margin: '0 auto' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          Progress: {completed} / {selectedDayTasks.length} tasks
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{percent}%</span>
                      </div>
                      <div style={{ background: 'var(--muted)', borderRadius: '8px', height: '10px', width: '100%' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'var(--accent)',
                          borderRadius: '8px',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {selectedDayTasks.length === 0 ? (
              <p className="text-center py-4" style={{ color: 'var(--muted-foreground)' }}>No tasks scheduled for this date.</p>
            ) : (
              <div className="space-y-3">
                {[...selectedDayTasks].sort((a, b) => {
                  if (!a.dueTime) return 1;
                  if (!b.dueTime) return -1;
                  return a.dueTime.localeCompare(b.dueTime);
                }).map(task => {
                  let bg = task.priority === 'high'
                    ? 'var(--accent-2)'
                    : task.priority === 'medium'
                      ? 'var(--accent)'
                      : 'var(--card)';
                  let color = (task.priority === 'high' || task.priority === 'medium') ? 'var(--accent-foreground)' : 'var(--foreground)';
                  let opacity = 1;
                  if (isOverdue(task, now)) {
                    bg = isDark ? '#7f1d1d' : '#fee2e2';
                    color = isDark ? '#fee2e2' : '#7f1d1d';
                    opacity = 1;
                  }
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] task-container overflow-hidden"
                      style={{ background: bg, color, opacity }}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!task.isCompleted) playCompleteSound();
                            onToggleComplete(task.id);
                          }}
                          className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                          style={{ background: task.isCompleted ? 'var(--accent-2)' : 'var(--background)', borderColor: task.isCompleted ? 'var(--accent-2)' : 'var(--primary-muted)' }}
                        >
                          {task.isCompleted && <CheckCircle className="h-3 w-3" style={{ color: 'var(--success-foreground, #fff)' }} />}
                        </button>
                        <div>
                          <h4 className="font-medium truncate" style={{ color: task.isCompleted ? 'var(--muted-foreground)' : color, textDecoration: task.isCompleted ? 'line-through' : 'none' }} title={task.title}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p 
                              className="text-sm mt-1 break-words overflow-hidden" 
                              style={{ 
                                color: 'var(--muted-foreground)',
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                maxHeight: "3rem"
                              }}
                              title={task.description}
                            >
                              {task.description}
                            </p>
                          )}
                          {Array.isArray(task.tags) && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {task.dueTime && (
                          <p className="text-sm px-2 py-1 rounded-md" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{formatTime12(task.dueTime)}</p>
                        )}
                        {task.estimatedDuration && (
                          <p className="text-sm px-2 py-1 rounded-md" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{task.estimatedDuration}m</p>
                        )}
                        <Badge variant={
                          task.priority === 'high' ? 'default' : 
                          task.priority === 'medium' ? 'default' : 
                          'secondary'
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(CalendarView);
