import mongoose from 'mongoose';
import { Task } from '../../database/models/task.model';
import { Todo } from '../../database/models/todo.model';
import { User } from '../../database/models/user.model';
import { AppError } from '../../utils/handlers/appError';
import { parseICS } from '../../utils/importExport/icsParser';

class DataService {
  async exportAll(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [tasks, todos, user] = await Promise.all([
      Task.find({ createdBy: userObjectId }),
      Todo.find({ createdBy: userObjectId }),
      User.findById(userId),
    ]);

    return {
      tasks,
      todos,
      settings: user?.settings,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };
  }

  async importJSON(userId: string, json: any) {
    const isLegacyFormat = !json.version || json.version !== '2.0';
    
    if (isLegacyFormat) {
      if (!json.tasks || !Array.isArray(json.tasks)) {
        throw new AppError('Invalid JSON format: missing tasks array', 400);
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      await Task.deleteMany({ createdBy: userObjectId });

      const tasksToInsert = json.tasks.map((t: any) => ({
        ...t,
        createdBy: userObjectId,
        _id: new mongoose.Types.ObjectId(),
        repeatFrequency: t.repeatFrequency || 'none',
        priority: t.priority || 'medium',
        descriptionType: t.descriptionType || 'text',
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
      }));

      if (tasksToInsert.length > 0) {
        await Task.insertMany(tasksToInsert);
      }

      return {
        tasksImported: tasksToInsert.length,
        todosImported: 0,
      };
    }

    if (!json.tasks || !Array.isArray(json.tasks)) {
      throw new AppError('Invalid JSON format: missing tasks array', 400);
    }

    if (!json.todos || !Array.isArray(json.todos)) {
      throw new AppError('Invalid JSON format: missing todos array', 400);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    await Promise.all([
      Task.deleteMany({ createdBy: userObjectId }),
      Todo.deleteMany({ createdBy: userObjectId }),
    ]);

    const tasksToInsert = json.tasks.map((t: any) => ({
      ...t,
      createdBy: userObjectId,
      _id: new mongoose.Types.ObjectId(),
      repeatFrequency: t.repeatFrequency || 'none',
      priority: t.priority || 'medium',
      descriptionType: t.descriptionType || 'text',
      dueDate: t.dueDate || new Date().toISOString().split('T')[0],
    }));

    const todosToInsert = json.todos.map((t: any) => ({
      ...t,
      createdBy: userObjectId,
      _id: new mongoose.Types.ObjectId(),
    }));

    await Promise.all([
      tasksToInsert.length > 0 ? Task.insertMany(tasksToInsert) : Promise.resolve(),
      todosToInsert.length > 0 ? Todo.insertMany(todosToInsert) : Promise.resolve(),
    ]);

    return {
      tasksImported: tasksToInsert.length,
      todosImported: todosToInsert.length,
    };
  }

  async importICS(userId: string, fileContent: string) {
    const events = parseICS(fileContent);

    if (events.length === 0) {
      throw new AppError('No valid events found in ICS file', 400);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const existingTasks = await Task.find({ createdBy: userObjectId });
    const existingKeys = new Set(
      existingTasks.map((t) => `${t.title}-${t.dueDate}-${t.dueTime || ''}`)
    );

    const newTasks = [];
    for (const event of events) {
      const key = `${event.title}-${event.dueDate}-${event.dueTime || ''}`;
      if (!existingKeys.has(key)) {
        newTasks.push({
          createdBy: userObjectId,
          title: event.title,
          description: event.description,
          descriptionType: 'text',
          dueDate: event.dueDate,
          dueTime: event.dueTime,
          priority: event.priority,
          estimatedDuration: event.estimatedDuration,
          isCompleted: false,
          assignedSlot: null,
          tags: [],
          repeatFrequency: 'none',
          type: 'ics-import',
        });
      }
    }

    if (newTasks.length > 0) {
      await Task.insertMany(newTasks);
    }

    return { tasksAdded: newTasks.length };
  }
}

export default new DataService();
