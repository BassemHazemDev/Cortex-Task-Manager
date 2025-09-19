import { useState, useEffect } from 'react'
import { Clock, Lightbulb, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TaskScheduler, SchedulingSuggestions, ConflictWarning } from './Scheduler'

const SmartScheduler = ({ tasks, onUpdateTask, onShowNotification, availableHours }) => {
  const [scheduler] = useState(() => new TaskScheduler(tasks, availableHours))
  const [pendingSuggestions, setPendingSuggestions] = useState([])
  const [autoRescheduling] = useState(false)
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState({})

  // Update scheduler when tasks change
  useEffect(() => {
    scheduler.tasks = tasks
    if (availableHours) {
      scheduler.availableHours = availableHours
    }
  }, [tasks, scheduler, availableHours])

  // Check for tasks that need rescheduling
  useEffect(() => {
    const checkForRescheduling = () => {
      const now = new Date()
      const suggestions = []

      tasks.forEach(task => {
        if (task.isCompleted || !task.dueDate) return

        const dueDate = new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : ''))
        const isOverdue = dueDate < now
        const isDueSoon = dueDate - now < 2 * 60 * 60 * 1000 // 2 hours

        // Suggest rescheduling for overdue tasks
        if (isOverdue && !task.assignedSlot) {
          const optimalSlots = scheduler.suggestOptimalSlots(task, 1)
          if (optimalSlots.length > 0) {
            suggestions.push({
              type: 'reschedule',
              task,
              reason: 'Task is overdue',
              suggestions: optimalSlots
            })
          }
        }

        // Suggest optimization for tasks due soon without optimal scheduling
        if (isDueSoon && !task.assignedSlot && task.priority === 'high') {
          const optimalSlots = scheduler.suggestOptimalSlots(task, 3)
          if (optimalSlots.length > 0 && optimalSlots[0].score > 80) {
            suggestions.push({
              type: 'optimize',
              task,
              reason: 'High priority task could be better scheduled',
              suggestions: optimalSlots
            })
          }
        }
      })

      setPendingSuggestions(suggestions)
    }

    checkForRescheduling()
    const interval = setInterval(checkForRescheduling, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [tasks, scheduler])

  // Show slot suggestions for rescheduling overdue task
  const handleShowRescheduleSuggestions = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const slots = scheduler.suggestOptimalSlots(task, 3)
      setRescheduleSuggestions(prev => ({ ...prev, [taskId]: slots }))
    }
  }

  // Accept a suggested slot for rescheduling
  const handleAcceptRescheduleSuggestion = async (taskId, slot) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      await onUpdateTask(taskId, {
        dueDate: slot.date,
        dueTime: slot.startTime,
        assignedSlot: {
          date: slot.date,
          time: slot.startTime
        }
      })
      setRescheduleSuggestions(prev => {
        const copy = { ...prev }
        delete copy[taskId]
        return copy
      })
      onShowNotification({
        type: 'success',
        message: `Task "${task.title}" has been rescheduled`,
        details: `Scheduled for ${scheduler.formatSlotDescription(slot)}`
      })
    }
  }

  // Dismiss reschedule suggestions
  const handleDismissRescheduleSuggestions = (taskId) => {
    setRescheduleSuggestions(prev => {
      const copy = { ...prev }
      delete copy[taskId]
      return copy
    })
  }

  const handleAcceptSuggestion = async (taskId, suggestion) => {
    const task = tasks.find(t => t.id === taskId)
    
    if (task) {
      await onUpdateTask(taskId, {
        dueDate: suggestion.date,
        dueTime: suggestion.startTime,
        assignedSlot: {
          date: suggestion.date,
          time: suggestion.startTime
        }
      })

      // Remove the suggestion
      setPendingSuggestions(prev => 
        prev.filter(s => s.task.id !== taskId)
      )

      onShowNotification({
        type: 'success',
        message: `Task "${task.title}" has been scheduled`,
        details: `Scheduled for ${scheduler.formatSlotDescription(suggestion)}`
      })
    }
  }

  const handleDismissSuggestion = (taskId) => {
    setPendingSuggestions(prev => 
      prev.filter(s => s.task.id !== taskId)
    )
  }

  const handleOptimizeSchedule = () => {
    const excludedTags = ['lecture', 'section', 'meeting', 'deadline', 'course'];
    const unscheduledTasks = tasks.filter(task => {
      if (task.isCompleted || !task.dueDate || task.assignedSlot) return false;
      if (Array.isArray(task.tags)) {
        // Exclude if any tag matches excludedTags
        return !task.tags.some(tag => excludedTags.includes(tag));
      }
      return true;
    });

    const optimizations = [];

    unscheduledTasks.forEach(task => {
      const suggestions = scheduler.suggestOptimalSlots(task, 1);
      if (suggestions.length > 0 && suggestions[0].score > 70) {
        optimizations.push({
          type: 'optimize',
          task,
          reason: 'Automatic schedule optimization',
          suggestions
        });
      }
    });

    setPendingSuggestions(prev => [...prev, ...optimizations]);

    onShowNotification({
      type: 'info',
      message: `Found ${optimizations.length} optimization suggestions`,
      details: 'Review the suggestions below'
    });
  }

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      if (task.isCompleted || !task.dueDate) return false;
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
    });
  }

  const getUpcomingTasks = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return tasks.filter(task => {
      if (task.isCompleted || !task.dueDate) return false
      const dueDate = new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : ''))
      return dueDate >= now && dueDate <= tomorrow
    })
  }

  const overdueTasks = getOverdueTasks()
  const upcomingTasks = getUpcomingTasks()

  return (
    <div className="space-y-4">
      {/* Smart Scheduling Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>Smart Scheduling</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Let AI optimize your schedule for better productivity
              </p>
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <Badge variant="destructive" className="w-2 h-2 p-0"></Badge>
                  <span>{overdueTasks.length} overdue</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Badge variant="default" className="w-2 h-2 p-0"></Badge>
                  <span>{upcomingTasks.length} upcoming</span>
                </span>
              </div>
            </div>
            <Button
              onClick={handleOptimizeSchedule}
              disabled={autoRescheduling}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {autoRescheduling ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              Optimize Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Suggestions */}
      {pendingSuggestions.map(suggestion => (
        <Card key={`${suggestion.task.id}-${suggestion.type}`} className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">
                  {suggestion.type === 'reschedule' ? 'Reschedule Suggestion' : 'Optimization Suggestion'}
                </span>
              </div>
              <Badge variant={suggestion.type === 'reschedule' ? 'destructive' : 'default'}>
                {suggestion.task.priority} priority
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-medium text-blue-900">{suggestion.task.title}</h4>
              <p className="text-sm text-blue-700">{suggestion.reason}</p>
            </div>

            <div className="space-y-2 mb-4">
              {suggestion.suggestions.slice(0, 3).map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-blue-600">
                      Score: {slot.score}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {scheduler.formatSlotDescription(slot)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.floor(slot.duration / 60)}h {slot.duration % 60}m available
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptSuggestion(suggestion.task.id, slot)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              {/* Auto-schedule button removed: handleAutoReschedule is not defined */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissSuggestion(suggestion.task.id)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Actions for Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <Calendar className="h-5 w-5" />
              <span>Overdue Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 dark:text-red-200 mb-3">
              You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}. 
              Would you like to reschedule them?
            </p>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map(task => (
                <div key={task.id}>
                  {/* If suggestions are open for this task, show them */}
                  {rescheduleSuggestions[task.id] ? (
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900 mb-2">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                          <span className="text-blue-800 dark:text-blue-100">Reschedule Suggestions</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">{task.title}</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-200">Choose a new time slot for this task:</p>
                        </div>
                        <div className="space-y-2 mb-4">
                          {rescheduleSuggestions[task.id].map((slot, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="text-blue-600 dark:text-blue-200">
                                  Score: {slot.score}
                                </Badge>
                                <div>
                                  <p className="font-medium dark:text-blue-100">{scheduler.formatSlotDescription(slot)}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{Math.floor(slot.duration / 60)}h {slot.duration % 60}m available</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRescheduleSuggestion(task.id, slot)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Choose
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissRescheduleSuggestions(task.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                      <div>
                        <p className="font-medium dark:text-red-100">{task.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Due: {(() => {
                            const dateObj = new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : ''));
                            const dateStr = dateObj.toLocaleDateString();
                            let timeStr = '';
                            if (task.dueTime) {
                              timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            }
                            return `${dateStr}${timeStr ? ` at ${timeStr}` : ''}`;
                          })()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowRescheduleSuggestions(task.id)}
                        disabled={autoRescheduling}
                        className="text-red-600 dark:text-red-200 border-red-300 hover:bg-red-100 dark:hover:bg-red-800"
                      >
                        Reschedule
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SmartScheduler

