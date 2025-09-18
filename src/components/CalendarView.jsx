import { formatDateTimeContext } from '@/lib/utils.js'
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';

// UI component mocks for demonstration; replace with your actual UI library imports in production.
const Button = ({ children, ...props }) => <button {...props}>{children}</button>;
const Card = ({ children, ...props }) => <div {...props}>{children}</div>;
const CardHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
const CardTitle = ({ children, ...props }) => <h3 {...props}>{children}</h3>;
const CardContent = ({ children, ...props }) => <div {...props}>{children}</div>;
const Badge = ({ children, variant, ...props }) => <span data-variant={variant} {...props}>{children}</span>;


const CalendarView = ({ selectedDate, onDateSelect, tasks, onTaskClick, onToggleComplete }) => {
  // Helper to check if a task is overdue (after its duration ends)
  function isOverdue(task) {
    if (!task.dueDate || task.isCompleted) return false;
    const now = new Date();
    if (!task.dueTime) {
      // No dueTime: overdue if the day is over
      const dayEnd = new Date(task.dueDate + 'T23:59:59');
      return now > dayEnd;
    }
    const start = new Date(task.dueDate + 'T' + task.dueTime);
    if (!task.estimatedDuration || isNaN(task.estimatedDuration) || task.estimatedDuration <= 0) {
      // No duration: overdue as soon as due time is met
      return now > start;
    } else {
      // Has duration: overdue after duration ends
      const end = new Date(start.getTime() + task.estimatedDuration * 60000);
      return now > end;
    }
  }
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
    const startingDayOfWeek = firstDay.getDay();

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

  const getTasksForDate = (date) => {
    if (!date) return [];
  // Converts a Date object to a local date string for accurate task filtering
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return tasks.filter(task => task.dueDate === dateStr);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
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

  // Converts a time string (HH:mm) to 12-hour format with AM/PM for better readability
  function formatTime12(timeStr) {
  // Use selectedDate for context
  if (!timeStr || !selectedDate) return '';
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
  return formatDateTimeContext(dateStr, timeStr);
  }

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDayTasks = getTasksForDate(selectedDate);

  return (
    <div className="space-y-6 p-4" style={{ background: 'var(--card)', color: 'var(--card-foreground)', minHeight: '100vh' }}>
  {/* Main calendar grid displaying the current month and navigation controls */}
      <Card style={{ background: 'var(--background)', color: 'var(--foreground)' }} className="rounded-xl shadow-md">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
        </CardHeader>
        <CardContent className="p-4">
          {/* Header row displaying day names (Sun-Sat) */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {day}
              </div>
            ))}
          </div>
          {/* Calendar days grid: each cell represents a day and displays tasks */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) return <div key={index} />;

              let dayTasks = getTasksForDate(date);
              // Sort tasks by dueTime if present
              dayTasks = [...dayTasks].sort((a, b) => {
                if (!a.dueTime) return 1;
                if (!b.dueTime) return -1;
                return a.dueTime.localeCompare(b.dueTime);
              });
              const hasHighPriority = dayTasks.some(task => task.priority === 'high' && !task.isCompleted);

              // Dynamically sets background and text color for each day cell based on state (today, selected, high priority)
              let dayBg = 'var(--card)';
              let dayBorder = 'var(--border)';
              let dayText = 'var(--foreground)';
              if (isToday(date)) {
                dayBg = isDark ? 'var(--primary)' : '#e0f2fe';
                dayBorder = isDark ? 'var(--primary)' : '#38bdf8';
                dayText = isDark ? 'var(--primary-foreground)' : '#0c4a6e';
              } else if (hasHighPriority) {
                // Treat high priority like medium: accent color, not red
                dayBg = 'var(--accent)';
                dayBorder = 'var(--accent)';
                dayText = 'var(--accent-foreground)';
              } else if (isSelected(date)) {
                dayBg = isDark ? 'var(--accent)' : '#bae6fd';
                dayBorder = isDark ? 'var(--accent)' : '#38bdf8';
                dayText = isDark ? 'var(--accent-foreground)' : '#0c4a6e';
              }
              return (
                <div
                  key={index}
                  className="min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                  style={{ background: dayBg, borderColor: dayBorder, color: dayText }}
                  onClick={() => onDateSelect(date)}
                >
                  <div className="text-sm font-semibold text-right mb-1" style={{ color: dayText }}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => {
                      // Renders each task in the day cell with appropriate color and click handler
                      let bg = task.priority === 'medium' || task.priority === 'high'
                        ? 'var(--accent)'
                        : (task.isCompleted ? 'var(--success, #22c55e)' : 'var(--muted)');
                      let color = task.priority === 'medium' || task.priority === 'high'
                        ? 'var(--accent-foreground)'
                        : (task.isCompleted ? 'var(--success-foreground, #fff)' : 'var(--foreground)');
                      let opacity = 1;
                      if (isOverdue(task)) {
                        bg = isDark ? '#7f1d1d' : '#fee2e2';
                        color = isDark ? '#fee2e2' : '#7f1d1d';
                        opacity = 1;
                      }
                      return (
                        <div
                          key={task.id}
                          className="text-xs p-1 rounded truncate shadow-md"
                          style={{ background: bg, color, textDecoration: task.isCompleted ? 'line-through' : 'none', opacity }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

  {/* Details card for the currently selected date, showing tasks and progress */}
      {selectedDate && (
        <Card style={{ background: 'var(--background)', color: 'var(--foreground)' }} className="rounded-xl shadow-md">
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
                    <div className="w-full">
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
                  let bg = (task.priority === 'medium' || task.priority === 'high') ? 'var(--accent)' : 'var(--card)';
                  let color = (task.priority === 'medium' || task.priority === 'high') ? 'var(--accent-foreground)' : 'var(--foreground)';
                  let opacity = task.priority === 'high' ? 0.8 : 1;
                  if (isOverdue(task)) {
                    bg = isDark ? '#7f1d1d' : '#fee2e2';
                    color = isDark ? '#fee2e2' : '#7f1d1d';
                    opacity = 1;
                  }
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:shadow-md cursor-pointer transition-colors shadow-md"
                      style={{ background: bg, color, opacity }}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task.id);
                          }}
                          className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                          style={{ background: task.isCompleted ? 'var(--success, #22c55e)' : bg, borderColor: task.isCompleted ? 'var(--success, #22c55e)' : 'var(--border)' }}
                        >
                          {task.isCompleted && <CheckCircle className="h-3 w-3" style={{ color: 'var(--success-foreground, #fff)' }} />}
                        </button>
                        <div>
                          <h4 className="font-medium" style={{ color: task.isCompleted ? 'var(--muted-foreground)' : color, textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{task.description}</p>
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

export default CalendarView;
