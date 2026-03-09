import { formatDateTimeContext } from "@/lib/utils.js";
import { useState, memo, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDateRefresh } from "../hooks/useDateRefresh";
import { useBulkActions } from "../hooks/useBulkActions";
import { CheckCircle, Clock, Calendar, Trash2, Filter, ListChecks, ChevronDown, ChevronUp, Copy, CalendarPlus, Edit, MoreVertical, ChevronLeft, ChevronRight, X, CheckSquare, Square, Check } from "lucide-react";
import { isOverdue } from "../utils/dateUtils";
import { playCompleteSound } from "../utils/audioUtils";
import { getTagColorClass } from "../utils/tagUtils";
import haptics from "../utils/haptics";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { EmptyState } from "./common/EmptyState";
import HighlightText from "./common/HighlightText";
import { ConfirmDialog } from "./ui/ConfirmDialog";

const FilterDropdown = ({ value, onChange, options, placeholder, width = "w-32" }) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const label = selectedOption ? selectedOption.label : placeholder;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between ${width} font-normal px-3 bg-background`}
          role="combobox"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{option.label}</span>
            {value === option.value && <Check className="ml-auto h-4 w-4 opacity-100" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function TagFilter({ tasks, tagFilter, setTagFilter }) {
  // Extracts all unique tags from the provided tasks array
  const allTags = Array.from(
    new Set(
      tasks.flatMap((task) => (Array.isArray(task.tags) ? task.tags : []))
    )
  );
  const toggleTag = (tag) => {
    if (tagFilter.includes(tag)) {
      setTagFilter(tagFilter.filter((t) => t !== tag));
    } else {
      setTagFilter([...tagFilter, tag]);
    }
  };
  if (allTags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {allTags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`px-2 py-1 rounded text-xs border transition-colors ${
            tagFilter.includes(tag)
              ? getTagColorClass(tag) + " ring-1 ring-offset-1 ring-primary"
              : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
          }`}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

const TaskList = ({ tasks, onTaskClick, onEditTask, onToggleComplete, onDeleteTask, onToggleSubtask }) => {
  // Use the date refresh hook to handle midnight transitions
  const { getToday, getTomorrow, getDayAfterTomorrow, now } = useDateRefresh();
  
  // Bulk actions state
  const {
    selectedIds,
    isSelectMode,
    hasSelection,
    selectionCount,
    toggleSelect,
    selectAll,
    deselectAll,
    exitSelectMode,
    enterSelectMode,
    isSelected,
  } = useBulkActions();

  // Bulk action handlers
  const handleBulkComplete = useCallback(() => {
    haptics.success();
    selectedIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task && !task.isCompleted) {
        onToggleComplete(id);
      }
    });
    exitSelectMode();
  }, [selectedIds, tasks, onToggleComplete, exitSelectMode]);

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(`Delete ${selectionCount} selected task(s)?`)) {
      haptics.medium();
      selectedIds.forEach(id => {
        onDeleteTask(id);
      });
      exitSelectMode();
    }
  }, [selectedIds, selectionCount, onDeleteTask, exitSelectMode]);
  
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };
  
  const [search, setSearch] = useState("");
  // Converts a time string (HH:mm) to 12-hour format with AM/PM for better readability
  function formatTime12(timeStr, dateStr) {
    if (!timeStr) return "";
    return formatDateTimeContext(
      dateStr || getToday(),
      timeStr
    );
  }
  const [filter, setFilter] = useState("all"); // Task status filter: all, pending, completed
  const [tagFilter, setTagFilter] = useState([]); // Selected tags for filtering
  const [sortBy, setSortBy] = useState("dueDate"); // Sorting method: dueDate, priority, title
  const [dayFilter, setDayFilter] = useState("today"); // Day filter: today, tomorrow, week, etc.
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 20;
  
  // Delete confirmation state
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);

  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          (task.title && task.title.toLowerCase().includes(q)) ||
          (task.description && task.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    switch (filter) {
      case "pending":
        filteredTasks = filteredTasks.filter((task) => !task.isCompleted);
        break;
      case "completed":
        filteredTasks = filteredTasks.filter((task) => task.isCompleted);
        break;
      default:
      // do nothing
    }

    // Tag filter
    if (tagFilter.length > 0) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          Array.isArray(task.tags) &&
          tagFilter.every((tag) => task.tags.includes(tag))
      );
    }

    // Day filter
    if (dayFilter !== "all") {
      const todayStr = getToday();
      const tomorrowStr = getTomorrow();
      const dayAfterTomorrowStr = getDayAfterTomorrow();
      const weekStart = new Date(now);
      // Adjust for Saturday-first week: Saturday=0, Sunday=1, etc.
      const daysSinceSaturday = (now.getDay() + 1) % 7;
      weekStart.setDate(now.getDate() - daysSinceSaturday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filteredTasks = filteredTasks.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        if (dayFilter === "today") {
          return task.dueDate === todayStr;
        } else if (dayFilter === "tomorrow") {
          return task.dueDate === tomorrowStr;
        } else if (dayFilter === "dayAfterTomorrow") {
          return task.dueDate === dayAfterTomorrowStr;
        } else if (dayFilter === "thisWeek") {
          return taskDate >= weekStart && taskDate <= weekEnd;
        } else if (dayFilter === "thisMonth") {
          return taskDate >= monthStart && taskDate <= monthEnd;
        }
        return true;
      });
    }

    // Apply sorting - create a copy to avoid mutating the filtered array
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === "priority") {
        // High priority first (descending)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityOrder[a.priority] || 0;
        const priorityB = priorityOrder[b.priority] || 0;
        return priorityB - priorityA;
      }
      
      if (sortBy === "title") {
        // Alphabetical order (A-Z)
        return (a.title || "").localeCompare(b.title || "");
      }
      
      if (sortBy === "latestAdded") {
        // Latest added first (descending by createdAt, fallback to id)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return b.id - a.id;
      }
      
      // Default: dueDate - Earliest due date first (ascending: Overdue -> Today -> Future)
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1; // No due date at the end
      if (!b.dueDate) return -1; // No due date at the end
      const dateA = new Date(a.dueDate + (a.dueTime ? `T${a.dueTime}` : "T00:00:00"));
      const dateB = new Date(b.dueDate + (b.dueTime ? `T${b.dueTime}` : "T00:00:00"));
      return dateA - dateB; // Ascending order
    });
  };



  const filteredTasks = getFilteredTasks();
  
  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [filteredTasks, currentPage, tasksPerPage]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, tagFilter, sortBy, dayFilter, search]);

  // Renders the main task list UI with filters, search, and summary
  return (
    <div
      className="space-y-6"
      style={{ background: "var(--card)", color: "var(--card-foreground)" }}
    >
      {/* Task filters, search bar, and sorting controls */}
      <Card>
        <CardHeader className={"task-container-1"}>
          <div className="flex items-center justify-between task-container-1">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-[var(--primary)]" />
              <span>Task List</span>
            </CardTitle>
            <div className="flex space-x-2 task-container-1">
              <div className="flex flex-col w-full gap-2 task-container-1">
                <div className="flex space-x-2 mb-2 task-container-1">
                    <div className="flex space-x-2 mb-2 task-container-2">
                      <FilterDropdown
                        value={filter}
                        onChange={setFilter}
                        width="w-32"
                        options={[
                          { value: "all", label: "All Statuses" },
                          { value: "pending", label: "Pending" },
                          { value: "completed", label: "Completed" },
                        ]}
                      />
                      <FilterDropdown
                        value={dayFilter}
                        onChange={setDayFilter}
                        width="w-32"
                        options={[
                          { value: "all", label: "All Dates" },
                          { value: "today", label: "Today" },
                          { value: "tomorrow", label: "Tomorrow" },
                          { value: "dayAfterTomorrow", label: "Day After Tomorrow" },
                          { value: "thisWeek", label: "This Week" },
                          { value: "thisMonth", label: "This Month" },
                        ]}
                      />
                    </div>

                    <div className="flex space-x-2 mb-2 task-container-2">
                      <FilterDropdown
                        value={tagFilter[0] || "all"}
                        onChange={(tag) => setTagFilter(tag === "all" ? [] : [tag])}
                        width="w-32"
                        placeholder="All Tags"
                        options={[
                          { value: "all", label: "All Tags" },
                          ...Array.from(new Set(tasks.flatMap(t => Array.isArray(t.tags) ? t.tags : []))).map(tag => ({
                            value: tag,
                            label: tag
                          }))
                        ]}
                      />
                      <FilterDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        width="w-32"
                        options={[
                          { value: "dueDate", label: "Due Date" },
                          { value: "latestAdded", label: "Latest Added" },
                          { value: "priority", label: "Priority" },
                          { value: "title", label: "Title" },
                        ]}
                      />
                    </div>
                </div>
                <div className="flex justify-center w-full task-container-search">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or description"
                    className="border-2 rounded-md px-4 py-2 text-base w-100 shadow-sm focus:outline-none transition-all"
                    style={{
                      minWidth: "220px",
                      maxWidth: "400px",
                      marginTop: "0.5rem",
                      boxShadow: "0 1px 6px 0 rgba(60, 120, 200, 0.08)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Actions Toolbar */}
      {isSelectMode ? (
        <Card className="sticky top-0 z-20 border-primary/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectionCount === paginatedTasks.length && paginatedTasks.length > 0}
                  onCheckedChange={(checked) => 
                    checked ? selectAll(paginatedTasks.map(t => t.id)) : deselectAll()
                  }
                />
                <span className="text-sm font-medium">
                  {selectionCount} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBulkComplete}
                  disabled={!hasSelection}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={!hasSelection}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={exitSelectMode}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredTasks.length > 0 && (
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            {/* Pagination controls */}
            {filteredTasks.length > tasksPerPage ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div />
            )}
            
            {/* Select button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={enterSelectMode}
              className="text-sm"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Select
            </Button>
          </div>
        )
      )}

      {/* Main task list display */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              {search.trim() || filter !== "all" || tagFilter.length > 0 || dayFilter !== "today" ? (
                <EmptyState
                  type="search"
                  title="No tasks found"
                  description="Try adjusting your filters or search terms"
                />
              ) : (
                <EmptyState
                  type="tasks"
                  title="No tasks yet"
                  description="Create your first task to start organizing your day!"
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
          {paginatedTasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                task.isCompleted ? "opacity-75" : ""
              }`}
              style={{
                background: "var(--background)",
                color: "var(--foreground)",
              }}
              onClick={() => onTaskClick(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Selection checkbox (only in select mode) */}
                    {isSelectMode && (
                      <Checkbox
                        checked={isSelected(task.id)}
                        onCheckedChange={() => toggleSelect(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    )}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.success();
                        if (!task.isCompleted) playCompleteSound();
                        onToggleComplete(task.id);
                      }}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        task.isCompleted
                          ? "bg-success border-success"
                          : "border-border hover:border-success"
                      }`}
                      style={{
                        background: task.isCompleted
                          ? "var(--accent-2)"
                          : "var(--background)",
                        borderColor: task.isCompleted
                          ? "var(--accent-2)"
                          : "var(--border)",
                      }}
                    >
                      {task.isCompleted && (
                        <CheckCircle
                          className="h-3 w-3"
                          style={{ color: "var(--success-foreground, #fff)" }}
                        />
                      )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1 card-content-container">
                        <h3
                          className={`font-medium truncate ${
                            task.isCompleted ? "line-through" : ""
                          }`}
                          style={{
                            color: task.isCompleted
                              ? "var(--muted-foreground)"
                              : "var(--foreground)",
                          }}
                        >
                          <HighlightText text={task.title} query={search} />
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(task.tags) &&
                            task.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className={`text-xs truncate max-w-[120px] ${getTagColorClass(tag)}`}
                                title={tag.length > 15 ? tag : undefined}
                              >
                                {tag}
                              </Badge>
                            ))}

                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          {isOverdue(task, now) && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p
                          className={`text-sm mb-2 break-words overflow-hidden ${
                            task.isCompleted ? "line-through" : ""
                          }`}
                          style={{ 
                            color: "var(--muted-foreground)",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            maxHeight: "4.5rem"
                          }}
                          title={task.description}
                        >
                          {task.description}
                        </p>
                      )}

                      <div
                        className="flex items-center space-x-4 text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {(() => {
                                if (task.dueTime) {
                                  return `${formatTime12(
                                    task.dueTime,
                                    task.dueDate
                                  )}`;
                                } else {
                                  return "Today";
                                }
                              })()}
                            </span>
                          </div>
                        )}
                        {task.estimatedDuration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{task.estimatedDuration}m</span>
                          </div>
                        )}

                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="flex items-center space-x-1" title="Subtasks completed">
                            <ListChecks className="h-4 w-4" />
                            <span>
                              {task.subtasks.filter((st) => st.isCompleted).length}/
                              {task.subtasks.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                   <div className="flex flex-col items-center space-y-2">
                    {task.subtasks && task.subtasks.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(task.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                       {expandedTasks.has(task.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Kebab menu for task actions */}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          if (onEditTask) onEditTask(task);
                          else onTaskClick(task);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          haptics.success();
                          if (!task.isCompleted) playCompleteSound();
                          onToggleComplete(task.id);
                        }}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {task.isCompleted ? 'Mark Pending' : 'Complete'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTask(task);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Subtasks List */}
                {expandedTasks.has(task.id) && task.subtasks && task.subtasks.length > 0 && (
                  <div className="mt-4 pl-8 space-y-2 border-l-2 border-border/50 ml-2">
                    {task.subtasks.map((subtask) => (
                      <div 
                        key={subtask.id} 
                        className="flex items-center space-x-3 group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                             e.stopPropagation();
                             if(onToggleSubtask) onToggleSubtask(task.id, subtask.id);
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            subtask.isCompleted
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/50 hover:border-primary"
                          }`}
                        >
                          {subtask.isCompleted && (
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          )}
                        </button>
                        <span 
                          className={`text-sm transition-all ${
                            subtask.isCompleted 
                              ? "text-muted-foreground line-through" 
                              : "text-foreground"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>
          ))}
          </AnimatePresence>
        )}
      </div>

      {/* Summary bar showing count of filtered and total tasks */}
      {filteredTasks.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div
              className="flex flex-wrap justify-between gap-2 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              <span>
                {filteredTasks.length > tasksPerPage 
                  ? `Showing ${(currentPage - 1) * tasksPerPage + 1}-${Math.min(currentPage * tasksPerPage, filteredTasks.length)} of ${filteredTasks.length} tasks`
                  : `Showing ${filteredTasks.length} of ${tasks.length} tasks`
                }
              </span>
              <span>
                {filteredTasks.filter((t) => !t.isCompleted).length} pending,{" "}
                {filteredTasks.filter((t) => t.isCompleted).length} completed
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmTask}
        onOpenChange={(open) => !open && setDeleteConfirmTask(null)}
        title="Delete Task"
        description={deleteConfirmTask ? `Are you sure you want to delete "${deleteConfirmTask.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteConfirmTask) {
            onDeleteTask(deleteConfirmTask.id);
          }
        }}
      />
    </div>
  );
};

export default memo(TaskList);
