import { formatDateTimeContext } from "@/lib/utils.js";
import { useState } from "react";
import { useDateRefresh } from "../hooks/useDateRefresh";
import { CheckCircle, Clock, Calendar, Trash2, Filter } from "lucide-react";
import { isOverdue } from "../utils/dateUtils";
import { playCompleteSound } from "../utils/audioUtils";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";

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
          className={`px-2 py-1 rounded text-xs border ${
            tagFilter.includes(tag)
              ? "bg-accent border-accent text-accent-foreground"
              : "bg-muted border-border text-muted-foreground"
          }`}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

const TaskList = ({ tasks, onTaskClick, onToggleComplete, onDeleteTask }) => {
  // Use the date refresh hook to handle midnight transitions
  const { getToday, getTomorrow, getDayAfterTomorrow, now } = useDateRefresh();
  
  const [search, setSearch] = useState("");
  // Converts a time string (HH:mm) to 12-hour format with AM/PM for better readability
  function formatTime12(timeStr, dateStr) {
    if (!timeStr) return "";
    return formatDateTimeContext(
      dateStr || getToday(),
      timeStr
    );
  }
  // Filter state: status, tags, sorting, and day
  const [filter, setFilter] = useState("all"); // Task status filter: all, pending, completed
  const [tagFilter, setTagFilter] = useState([]); // Selected tags for filtering
  const [sortBy, setSortBy] = useState("dueDate"); // Sorting method: dueDate, priority, title
  const [dayFilter, setDayFilter] = useState("today"); // Day filter: today, tomorrow, week, etc.

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

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case "title": {
          return a.title.localeCompare(b.title);
        }
        case "dueDate":
        default: {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const dateA = new Date(
            a.dueDate + (a.dueTime ? `T${a.dueTime}` : "")
          );
          const dateB = new Date(
            b.dueDate + (b.dueTime ? `T${b.dueTime}` : "")
          );
          return dateA - dateB;
        }
      }
    });
  };



  const filteredTasks = getFilteredTasks();

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
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="select-item">
                        <SelectItem value="all" className="select-item">
                          All Statuses
                        </SelectItem>
                        <SelectItem value="pending" className="select-item">
                          Pending
                        </SelectItem>
                        <SelectItem value="completed" className="select-item">
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dayFilter} onValueChange={setDayFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="select-item">
                        <SelectItem value="all" className="select-item">
                          All Dates
                        </SelectItem>
                        <SelectItem value="today" className="select-item">
                          Today
                        </SelectItem>
                        <SelectItem value="tomorrow" className="select-item">
                          Tomorrow
                        </SelectItem>
                        <SelectItem
                          value="dayAfterTomorrow"
                          className="select-item"
                        >
                          Day After Tomorrow
                        </SelectItem>
                        <SelectItem value="thisWeek" className="select-item">
                          This Week
                        </SelectItem>
                        <SelectItem value="thisMonth" className="select-item">
                          This Month
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2 mb-2 task-container-2">
                    {/* Tag filter dropdown */}
                    <Select
                      value={tagFilter[0] || "all"}
                      onValueChange={(tag) =>
                        setTagFilter(tag === "all" ? [] : [tag])
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>{tagFilter[0] || "All Tags"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="select-item">
                          All Tags
                        </SelectItem>
                        {Array.from(
                          new Set(
                            tasks.flatMap((task) =>
                              Array.isArray(task.tags) ? task.tags : []
                            )
                          )
                        ).map((tag) => (
                          <SelectItem
                            key={tag}
                            value={tag}
                            className="select-item"
                          >
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="select-item">
                        <SelectItem value="dueDate" className="select-item">
                          Due Date
                        </SelectItem>
                        <SelectItem value="priority" className="select-item">
                          Priority
                        </SelectItem>
                        <SelectItem value="title" className="select-item">
                          Title
                        </SelectItem>
                      </SelectContent>
                    </Select>
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

      {/* Main task list display */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div
                className="text-center"
                style={{ color: "var(--muted-foreground)" }}
              >
                <CheckCircle
                  className="h-12 w-12 mx-auto mb-4"
                  style={{ color: "var(--muted)" }}
                />
                <p>No tasks found</p>
                <p className="text-sm">
                  Try adjusting your filters or add a new task
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                    </button>

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
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(task.tags) &&
                            task.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs truncate max-w-[120px]"
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
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    style={{
                      color: "var(--destructive)",
                      background: "transparent",
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary bar showing count of filtered and total tasks */}
      {filteredTasks.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div
              className="flex justify-between text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              <span>
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
              <span>
                {filteredTasks.filter((t) => !t.isCompleted).length} pending,{" "}
                {filteredTasks.filter((t) => t.isCompleted).length} completed
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskList;
