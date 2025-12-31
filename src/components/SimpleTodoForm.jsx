/**
 * SimpleTodoForm Component
 * 
 * A simplified modal form for adding quick TODO items.
 * Unlike regular tasks, these TODOs only have:
 * - Title
 * - Description
 * - Priority
 * 
 * They are stored separately and don't appear in the calendar.
 */

import { useState, memo } from "react";
import { CheckCircle, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Label } from "@/components/ui/label.jsx";

function SimpleTodoForm({ todo, onSave, onCancel }) {
  const [formData, setFormData] = useState(() => {
    if (todo) {
      return {
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
      };
    }
    return {
      title: '',
      description: '',
      priority: 'medium',
    };
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const todoData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
    };

    onSave(todoData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md" style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
                <span>{todo ? 'Edit TODO' : 'Add Quick TODO'}</span>
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
              {/* Title input (required) */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="What needs to be done?"
                  className={errors.title ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Description input (optional) */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Add any details..."
                  rows={3}
                />
              </div>

              {/* Priority selection */}
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
                  {todo ? 'Update TODO' : 'Add TODO'}
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
  );
}

export default memo(SimpleTodoForm);
