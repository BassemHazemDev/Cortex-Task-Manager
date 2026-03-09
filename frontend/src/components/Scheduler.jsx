// Intelligent Task Scheduler
// This component handles automatic rescheduling and suggestions for optimal task placement

export class TaskScheduler {
  constructor(tasks = [], availableHours = { start: "13:00", end: "22:00" }) {
    this.tasks = tasks;
    this.availableHours = availableHours;
  }

  // Find available time slots for a task
  findAvailableSlots(task, date = new Date()) {
    const slots = [];
    const taskDuration = task.estimatedDuration || 60; // minutes
    // Use availableHours for start/end
    const startTimeStr = (this.availableHours && this.availableHours.start) ? this.availableHours.start : "13:00";
    const endTimeStr = (this.availableHours && this.availableHours.end) ? this.availableHours.end : "22:00";
    const startDate = new Date(date);
    const [startHour, startMin] = startTimeStr.split(":").map(Number);
    startDate.setHours(startHour, startMin, 0, 0);
    const endDate = new Date(date);
    const [endHour, endMin] = endTimeStr.split(":").map(Number);
    endDate.setHours(endHour, endMin, 0, 0);

    // Get existing tasks for the date
    const dateStr = date.toISOString().split('T')[0]
    const existingTasks = this.tasks.filter(t => 
      t.dueDate === dateStr && 
      t.dueTime && 
      !t.isCompleted &&
      t.id !== task.id
    )

    // Sort existing tasks by time
    existingTasks.sort((a, b) => {
      const timeA = this.timeToMinutes(a.dueTime)
      const timeB = this.timeToMinutes(b.dueTime)
      return timeA - timeB
    })

    // If scheduling for today, only suggest slots after current time
    let currentTime = this.timeToMinutes(startTimeStr);
    const endTime = this.timeToMinutes(endTimeStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    let minStartTime = currentTime;
    if (isToday) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (nowMinutes > currentTime) {
        // Round up to next 30-min increment
        minStartTime = Math.ceil(nowMinutes / 30) * 30;
      }
    }

    // Find gaps between existing tasks
    for (let i = 0; i <= existingTasks.length; i++) {
      let nextTaskTime
      
      if (i === existingTasks.length) {
        nextTaskTime = endTime
      } else {
        nextTaskTime = this.timeToMinutes(existingTasks[i].dueTime)
      }

        // For today, only suggest slots after minStartTime
        let slotStart = Math.max(currentTime, minStartTime)
        // Always round slotStart to next 30-min increment
        slotStart = Math.ceil(slotStart / 30) * 30
        while (slotStart + taskDuration <= nextTaskTime) {
          slots.push({
            startTime: this.minutesToTime(slotStart),
            endTime: this.minutesToTime(slotStart + taskDuration),
            duration: nextTaskTime - slotStart,
            date: dateStr
          })
          // Suggest slots every 30 minutes
          slotStart += 30
        }

        if (i < existingTasks.length) {
          const taskDuration = existingTasks[i].estimatedDuration || 60
          currentTime = nextTaskTime + taskDuration
        }
    }

    return slots
  }

  // Suggest optimal time slots for a task
  suggestOptimalSlots(task, maxSuggestions = 3) {
    const suggestions = []
    const now = new Date()
    // If task is overdue, start from today
    let startDate = now
    if (task.dueDate) {
      const dueDateObj = new Date(task.dueDate)
      if (dueDateObj > now) {
        startDate = dueDateObj
      }
    }

    // Priority scoring factors
    const priorityMultiplier = {
      high: 3,
      medium: 2,
      low: 1
    }

    // Check next 7 days from startDate
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date(startDate)
      checkDate.setDate(startDate.getDate() + dayOffset)
      const slots = this.findAvailableSlots(task, checkDate)
      slots.forEach(slot => {
        const score = this.calculateSlotScore(slot, task, dayOffset, priorityMultiplier)
        suggestions.push({
          ...slot,
          score,
          dayOffset,
          isToday: dayOffset === 0,
          isTomorrow: dayOffset === 1
        })
      })
    }

    // Sort by score (highest first) and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
  }

  // Calculate score for a time slot
  calculateSlotScore(slot, task, dayOffset, priorityMultiplier) {
    let score = 100 // Base score

    // Prefer earlier in the day for high priority tasks
    const startHour = this.timeToMinutes(slot.startTime) / 60
    if (task.priority === 'high' && startHour < 12) {
      score += 20
    }

    // Prefer afternoon for low priority tasks
    if (task.priority === 'low' && startHour >= 14) {
      score += 10
    }

    // Penalty for later days
    score -= dayOffset * 5

    // Bonus for having extra time in the slot
    const extraTime = slot.duration - (task.estimatedDuration || 60)
    if (extraTime > 30) {
      score += 10
    }

    // Priority multiplier
    score *= priorityMultiplier[task.priority] || 1

    return Math.round(score)
  }

  // Automatically reschedule a task
  autoReschedule(task) {
    const suggestions = this.suggestOptimalSlots(task, 1)
    
    if (suggestions.length > 0) {
      const bestSlot = suggestions[0]
      return {
        success: true,
        newSlot: {
          date: bestSlot.date,
          time: bestSlot.startTime
        },
        reason: `Automatically rescheduled to ${this.formatSlotDescription(bestSlot)}`
      }
    }

    return {
      success: false,
      reason: 'No available slots found for rescheduling'
    }
  }

  // Check for scheduling conflicts
  checkConflicts(task, proposedDate, proposedTime) {
    const conflicts = []
    const taskDuration = task.estimatedDuration || 60
    const proposedStart = this.timeToMinutes(proposedTime)
    const proposedEnd = proposedStart + taskDuration

    const dateStr = proposedDate
    const existingTasks = this.tasks.filter(t => 
      t.dueDate === dateStr && 
      t.dueTime && 
      !t.isCompleted &&
      t.id !== task.id
    )

    existingTasks.forEach(existingTask => {
      const existingStart = this.timeToMinutes(existingTask.dueTime)
      const existingEnd = existingStart + (existingTask.estimatedDuration || 60)

      // Check for overlap
      if (
        (proposedStart >= existingStart && proposedStart < existingEnd) ||
        (proposedEnd > existingStart && proposedEnd <= existingEnd) ||
        (proposedStart <= existingStart && proposedEnd >= existingEnd)
      ) {
        conflicts.push(existingTask)
      }
    })

    return conflicts
  }

  // Suggest alternative times when there's a conflict
  suggestAlternatives(task, conflictingDate, conflictingTime) {
    const alternatives = this.suggestOptimalSlots(task, 5)
    
    return alternatives.filter(slot => 
      !(slot.date === conflictingDate && slot.startTime === conflictingTime)
    ).slice(0, 3)
  }

  // Utility functions
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  formatSlotDescription(slot) {
    return formatDateTimeContext(slot.date, slot.startTime);
  }

  formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
  if (!timeStr) return '';
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

// React component for scheduling suggestions
import { useState } from 'react'
import { Clock, Calendar, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { formatDateTimeContext } from '@/lib/utils.js'

export const SchedulingSuggestions = ({ task, tasks, onAcceptSuggestion, onDismiss }) => {
  const [scheduler] = useState(() => new TaskScheduler(tasks))
  const [suggestions] = useState(() => scheduler.suggestOptimalSlots(task, 3))

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Clock className="h-5 w-5" />
          <span>Scheduling Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-700 mb-4">
          We found some optimal time slots for "{task.title}":
        </p>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-blue-600">
                  Score: {suggestion.score}
                </Badge>
                <div>
                  <p className="font-medium">
                    {scheduler.formatSlotDescription(suggestion)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {Math.floor(suggestion.duration / 60)}h {suggestion.duration % 60}m available
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onAcceptSuggestion(suggestion)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// React component for conflict warnings
export const ConflictWarning = ({ conflicts, alternatives, onSelectAlternative, onForceSchedule, onCancel }) => {
  const [scheduler] = useState(() => new TaskScheduler())

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span>Scheduling Conflict</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          This time slot conflicts with {conflicts.length} existing task{conflicts.length > 1 ? 's' : ''}:
        </p>
        
        <div className="space-y-2 mb-4">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="p-2 bg-white rounded border">
              <p className="font-medium">{conflict.title}</p>
              <p className="text-sm text-gray-600">
                {conflict.dueTime} ({conflict.estimatedDuration}m)
              </p>
            </div>
          ))}
        </div>

        {alternatives.length > 0 && (
          <>
            <p className="text-sm text-red-700 mb-3">
              Suggested alternatives:
            </p>
            <div className="space-y-2 mb-4">
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                  onClick={() => onSelectAlternative(alt)}
                >
                  <span className="text-sm">
                    {scheduler.formatSlotDescription(alt)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onForceSchedule}
            className="text-red-600 border-red-300 hover:bg-red-100"
          >
            Schedule Anyway
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

