import { useState, memo, useCallback } from 'react'
import { X, Save, Calendar, Clock, AlertCircle, Plus, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { SubtaskList } from './SubtaskList'
import { useTaskTemplates } from '@/hooks/useTaskTemplates'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getTagColorClass } from '@/utils/tagUtils'

const TaskForm = ({ task, initialDate, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    if (task) {
      return {
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate || '',
        dueTime: task.dueTime || '',
        priority: task && task.priority ? task.priority : 'medium',
        estimatedDuration: task.estimatedDuration || 60,
        tags: task.tags || [],
        repeatUntil: task.repeatUntil || '',
        repeatFrequency: task.repeatFrequency || 'none',
        subtasks: task.subtasks || []
      };
    }
    return {
      title: '',
      description: '',
      descriptionType: 'text', // Default to text
      dueDate: initialDate || '',
      dueTime: '',
      priority: 'medium',
      estimatedDuration: 60,
      tags: [],
      repeatUntil: '',
      repeatFrequency: 'none',
      subtasks: []
    };
  });


  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    }

    if (formData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = 'Duration must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Sanitize duration
    let duration = parseInt(formData.estimatedDuration)
    if (isNaN(duration) || duration < 1) duration = 1
      // Ensure dueDate and dueTime are saved separately
      let dueDate = formData.dueDate;
      let dueTime = formData.dueTime;
      // Validate and format dueDate and dueTime
      if (dueDate) {
        // Ensure dueDate is in YYYY-MM-DD format
        const d = new Date(`${dueDate}${dueTime ? `T${dueTime}` : ''}`);
        const pad = (n) => n.toString().padStart(2, '0');
        dueDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        if (dueTime) {
          dueTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else {
          dueTime = '';
        }
      }
      const taskData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        estimatedDuration: duration,
        dueDate,
        dueTime,
        tags: formData.tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
      }

    if (task) {
      onSave({ ...taskData, id: task.id })
    } else {
      onSave(taskData)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Predefined system tags for quick selection and organization
  const [systemTags, setSystemTags] = useState([
    'task', 'course', 'lecture', 'section', 'deadline', 'meeting', 'activity'
  ]);
  const removeSystemTag = (tag) => {
    setSystemTags(prev => prev.filter(t => t !== tag));
    // Also remove from current task if present
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };
  const [tagInput, setTagInput] = useState('');
  // Adds a new tag to both the form data and the system tag list if not already present
  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      if (!systemTags.includes(newTag)) {
        setSystemTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    }
  };
  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const [subtaskInput, setSubtaskInput] = useState('');

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSubtask = {
      id: Date.now(),
      title: subtaskInput.trim(),
      isCompleted: false
    };
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask]
    }));
    setSubtaskInput('');
  };

  const handleUpdateSubtask = (id, updates) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => st.id === id ? { ...st, ...updates } : st)
    }));
  };

  const handleDeleteSubtask = (id) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== id)
    }));
  };

  const handleToggleSubtask = (id) => {
      setFormData(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(st => 
          st.id === id ? { ...st, isCompleted: !st.isCompleted } : st
        )
      }));
  };

  const { templates, addTemplate, applyTemplate } = useTaskTemplates();

  const handleApplyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId || t.name === templateId); // Handle ID or Name if SelectValue returns string
    // Shadcn Select value is string. If we use IDs, we need to find by ID.
    // If IDs are numbers, we might need parsing.
    // Let's assume passed value is ID string.
    
    if (template) {
       const defaults = applyTemplate(template);
       setFormData(prev => ({
         ...prev,
         ...defaults,
         // valid check for title to append if needed, or just replace?
         // Plan says "returns pre-filled task data".
         // Let's replace simple fields but maybe keep date if set?
         // Actually, if I select "Meeting", I probably want duration, priority, tags.
         // Title might be "Meeting: " prefix.
         title: defaults.title || prev.title,
         estimatedDuration: defaults.estimatedDuration || prev.estimatedDuration,
         priority: defaults.priority || prev.priority,
         tags: [...new Set([...prev.tags, ...(defaults.tags || [])])],
         description: defaults.description || prev.description,
         descriptionType: defaults.descriptionType || 'text'
       }));
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Handle Description Change based on type
  const handleDescriptionChange = (val) => {
    if (formData.descriptionType === 'list') {
       // Auto-bullet logic could go here if we wanted complex handling
       // For now just raw text update
    }
    handleChange('description', val);
  };

  const handleKeyDownDescription = (e) => {
    if (formData.descriptionType === 'list' && e.key === 'Enter') {
      e.preventDefault();
      const cursorPosition = e.target.selectionStart;
      const currentValue = formData.description;
      const newValue = currentValue.substring(0, cursorPosition) + '\n- ' + currentValue.substring(e.target.selectionEnd);
      handleChange('description', newValue);
      // We would need to set cursor position ref here ideally, but simple for now
      setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = cursorPosition + 3;
      }, 0);
    }
  }

  useKeyboardShortcuts({
    'ctrl+enter': handleSubmit
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md" style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-[var(--primary)]" />
                <span>{task ? 'Edit Task' : 'Add New Task'}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Template Selector */}
            {!task && (
              <div className="flex gap-2 items-end mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Apply Template</Label>
                  <Select onValueChange={(val) => {
                     // Find template by some ID.
                     // Since ID can be number, and Select value is string.
                     const tmpl = templates.find(t => String(t.id) === val || t.name === val);
                     if (tmpl) handleApplyTemplate(tmpl.id);
                  }}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id || t.name} value={String(t.id || t.name)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Task title input (required) */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter task title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Task description input (supports types) */}
            <div className="space-y-2">
              <Label htmlFor="description">
                 Description {formData.descriptionType !== 'text' ? `(${formData.descriptionType})` : ''}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onKeyDown={handleKeyDownDescription}
                placeholder={
                   formData.descriptionType === 'list' ? '- Item 1\n- Item 2' :
                   formData.descriptionType === 'chunks' ? '[Section]\nContent...' :
                   "Enter task description (optional)"
                }
                rows={5}
                className={formData.descriptionType === 'chunks' ? 'font-mono text-sm' : ''}
              />
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <div className="flex gap-2">
                <Input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Add a subtask"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSubtask} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <SubtaskList 
                subtasks={formData.subtasks}
                onToggle={handleToggleSubtask}
                onDelete={handleDeleteSubtask}
                onUpdate={handleUpdateSubtask}
              />
            </div>

            {/* Due date input (required) */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <DatePicker
                date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                onSelect={(date) => {
                  // Use local time for YYYY-MM-DD string to avoid timezone shifts
                  // Create a date object that represents noon to avoid edge cases or just format relative to local
                  // To output 'YYYY-MM-DD' correctly in local time:
                  var dateStr = '';
                  if (date) {
                      const offset = date.getTimezoneOffset(); 
                      const localDate = new Date(date.getTime() - (offset*60*1000));
                      dateStr = localDate.toISOString().split('T')[0];
                  }
                  handleChange('dueDate', dateStr);
                  if (errors.dueDate) setErrors({ ...errors, dueDate: null });
                }}
                className={errors.dueDate ? "border-red-500" : ""}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs">{errors.dueDate}</p>
              )}
            </div>

            {/* Due time input (optional) */}
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <TimePicker
                 time={formData.dueTime}
                 onSelect={(time) => handleChange('dueTime', time)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes) *</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleChange('estimatedDuration', e.target.value)}
                min="1"
                step="1"
                placeholder=""
                className={errors.estimatedDuration ? 'border-red-500' : ''}
              />
              {errors.estimatedDuration && (
                <p className="text-sm text-red-500">{errors.estimatedDuration}</p>
              )}
              <p className="text-sm text-gray-500">
                This helps with intelligent scheduling
              </p>
            </div>

            {/* Tag selection and management section */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              {/* Dropdown for predefined tags (multi-select) with remove option */}
              <div className="flex flex-wrap gap-2 mb-2">
                {systemTags.map(tag => (
                  <span key={tag} className="flex items-center">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded text-xs border ${
                         formData.tags.includes(tag) 
                           ? getTagColorClass(tag) + " ring-1 ring-primary"
                           : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                      onClick={() => {
                        if (formData.tags.includes(tag)) {
                          removeTag(tag);
                        } else {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                        }
                      }}
                    >
                      {tag}
                    </button>
                    <button
                      type="button"
                      className="ml-1 text-xs text-red-500"
                      title="Remove tag from system"
                      onClick={() => removeSystemTag(tag)}
                    >×</button>
                  </span>
                ))}
              </div>
              {/* Input for adding new tag */}
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add a new tag"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" onClick={addTag} size="sm">Add</Button>
              </div>
              {/* Shows all selected tags with a delete button for each */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span key={tag} className={`px-2 py-1 rounded flex items-center gap-1 text-xs border ${getTagColorClass(tag)}`}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-inherit opacity-70 hover:opacity-100 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimated duration and repeat options */}
            <div className="space-y-2">
              <Label htmlFor="repeatFrequency">Repeat</Label>
              <Select value={formData.repeatFrequency} onValueChange={value => handleChange('repeatFrequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repeat frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeatUntil">Repeat Until (optional)</Label>
              <Input
                id="repeatUntil"
                type="date"
                value={formData.repeatUntil}
                onChange={(e) => handleChange('repeatUntil', e.target.value)}
                min={formData.dueDate}
                disabled={formData.repeatFrequency === 'none'}
              />
              <p className="text-sm text-gray-500">If set, this task will repeat according to the selected frequency until the chosen date.</p>
            </div>
            

            {/* Form action buttons: save or cancel */}
            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                className="flex-1 text-white"
                style={{ background: 'var(--primary)', border: '1px solid var(--accent-2)' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--primary-muted)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}
              >
                <Save className="h-4 w-4 mr-2" />
                {task ? 'Update Task' : 'Add Task'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
        </div>
      </Card>
    </div>
  )
}

export default memo(TaskForm)
