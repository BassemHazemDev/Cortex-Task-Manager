import { useState, useEffect } from 'react'
import { X, Save, Calendar, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'

const TaskForm = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    estimatedDuration: 60,
    tags: [],
  repeatUntil: '', // Optional: date until which the task should repeat
  repeatFrequency: 'none' // Repeat frequency: none, daily, weekly, monthly, yearly
  })


  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate || '',
        dueTime: task.dueTime || '',
        priority: task.priority || 'medium',
        estimatedDuration: task.estimatedDuration || 60,
        tags: task.tags || [],
        repeatUntil: task.repeatUntil || '',
        repeatFrequency: task.repeatFrequency || 'none'
      });
    }
  }, [task]);

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

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md" style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
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

            {/* Task description input (optional) */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter task description (optional)"
                rows={3}
              />
            </div>

            {/* Due date input (required) */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  min={getTodayDate()}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate}</p>
              )}
            </div>

            {/* Due time input (optional) */}
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time (optional)</Label>
              <div className="relative">
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => handleChange('dueTime', e.target.value)}
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
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
                      style={{
                        background: formData.tags.includes(tag) ? 'var(--accent)' : 'var(--card)',
                        color: formData.tags.includes(tag) ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                        border: `1px solid ${formData.tags.includes(tag) ? 'var(--accent)' : 'var(--border)'}`
                      }}
                      className="px-2 py-1 rounded text-xs border"
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
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-xs text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
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
                  <SelectValue />
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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

export default TaskForm

