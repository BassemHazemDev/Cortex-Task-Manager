import mongoose from 'mongoose';
import { Task, ITask } from '../../database/models/task.model';
import { AppError } from '../../utils/handlers/appError';
import { hasTimeConflict, generateRecurringDates } from '../../utils/scheduler/schedulerUtils';
import type { CreateTaskInput, UpdateTaskInput, TaskQuery, TaskStatistics } from './task.types';

class TaskService {
  async findAll(userId: string, query: TaskQuery): Promise<{
    tasks: ITask[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const today = new Date().toISOString().split('T')[0];

    const filter: any = { createdBy: userObjectId };

    if (query.status === 'pending') {
      filter.isCompleted = false;
    } else if (query.status === 'completed') {
      filter.isCompleted = true;
    } else if (query.status === 'overdue') {
      filter.isCompleted = false;
      filter.dueDate = { $lt: today };
    }

    if (query.day && query.day !== 'all') {
      let startDate: string;
      let endDate: string;

      switch (query.day) {
        case 'today':
          startDate = today;
          endDate = today;
          break;
        case 'tomorrow':
          startDate = this.addDays(today, 1);
          endDate = startDate;
          break;
        case 'dayAfterTomorrow':
          startDate = this.addDays(today, 2);
          endDate = startDate;
          break;
        case 'thisWeek':
          startDate = today;
          endDate = this.addDays(today, 7);
          break;
        case 'thisMonth':
          startDate = today;
          endDate = this.addDays(today, 30);
          break;
        default:
          startDate = today;
          endDate = today;
      }

      filter.dueDate = { $gte: startDate, $lte: endDate };
    }

    if (query.tags) {
      const tags = query.tags.split(',').map((t) => t.trim());
      filter.tags = { $all: tags };
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { tags: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    let sort: any = { dueDate: 1 };
    if (query.sort === 'priority') {
      sort = { priority: -1 };
    } else if (query.sort === 'title') {
      sort = { title: 1 };
    } else if (query.sort === 'createdAt') {
      sort = { createdAt: -1 };
    }

    const tasks = await Task.find(filter).sort(sort).skip(skip).limit(limit);
    const total = await Task.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return { tasks, total, totalPages, currentPage: page };
  }

  async findById(userId: string, id: string): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return task;
  }

  async create(userId: string, data: CreateTaskInput): Promise<{
    task?: ITask;
    tasksAdded?: number;
    tasks?: ITask[];
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (data.repeatFrequency && data.repeatFrequency !== 'none' && data.repeatUntil) {
      const dates = generateRecurringDates(data.dueDate, data.repeatFrequency, data.repeatUntil);

      const existingTasks = await Task.find({
        createdBy: userObjectId,
        dueDate: { $in: dates },
      });

      const newTasks = [];
      for (const date of dates) {
        const conflict = existingTasks.find(
          (t) =>
            t.dueDate === date &&
            t.dueTime === data.dueTime &&
            hasTimeConflict(
              { ...data, dueDate: date, assignedSlot: data.dueTime ? { date, time: data.dueTime } : null } as any,
              t
            )
        );

        if (!conflict) {
          newTasks.push({
            ...data,
            createdBy: userObjectId,
            dueDate: date,
          });
        }
      }

      if (newTasks.length > 0) {
        const created = await Task.insertMany(newTasks) as unknown as ITask[];
        return { tasksAdded: created.length, tasks: created };
      }

      return { tasksAdded: 0 };
    }

    const task = await Task.create({
      ...data,
      createdBy: userObjectId,
    });

    return { task };
  }

  async update(userId: string, id: string, updates: UpdateTaskInput): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updated = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return updated!;
  }

  async delete(userId: string, id: string): Promise<ITask> {
    const task = await Task.findOneAndDelete({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return task;
  }

  async toggleComplete(userId: string, id: string): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const isCompleted = !task.isCompleted;
    const completedAt = isCompleted ? new Date() : undefined;

    const updated = await Task.findByIdAndUpdate(
      id,
      { isCompleted, completedAt },
      { new: true }
    );

    return updated!;
  }

  async bulkComplete(userId: string, ids: string[]): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Task.updateMany(
      { _id: { $in: ids }, createdBy: userObjectId },
      { isCompleted: true, completedAt: new Date() }
    );
    return result.modifiedCount;
  }

  async bulkDelete(userId: string, ids: string[]): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Task.deleteMany({ _id: { $in: ids }, createdBy: userObjectId });
    return result.deletedCount;
  }

  async dropReschedule(userId: string, id: string, newDate: string): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { dueDate: newDate, assignedSlot: null },
      { new: true }
    );

    return updated!;
  }

  async assignSlot(userId: string, id: string, slot: { date: string; time: string }): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { assignedSlot: slot },
      { new: true }
    );

    return updated!;
  }

  async addSubtask(userId: string, id: string, subtask: { title: string }): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      {
        $push: {
          subtasks: {
            title: subtask.title,
            isCompleted: false,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return updated!;
  }

  async updateSubtask(
    userId: string,
    id: string,
    sid: string,
    updates: { title?: string; isCompleted?: boolean }
  ): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const subtaskIndex = task.subtasks.findIndex((s) => s._id.toString() === sid);
    if (subtaskIndex === -1) {
      throw new AppError('Subtask not found', 404);
    }

    const setObj: any = {};
    if (updates.title !== undefined) setObj[`subtasks.${subtaskIndex}.title`] = updates.title;
    if (updates.isCompleted !== undefined) setObj[`subtasks.${subtaskIndex}.isCompleted`] = updates.isCompleted;

    const updated = await Task.findByIdAndUpdate(id, { $set: setObj }, { new: true });
    return updated!;
  }

  async deleteSubtask(userId: string, id: string, sid: string): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updated = await Task.findByIdAndUpdate(
      id,
      { $pull: { subtasks: { _id: new mongoose.Types.ObjectId(sid) } } },
      { new: true }
    );

    return updated!;
  }

  async toggleSubtaskComplete(userId: string, id: string, sid: string): Promise<ITask> {
    const task = await Task.findOne({ _id: id, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const subtask = task.subtasks.find((s) => s._id.toString() === sid);
    if (!subtask) {
      throw new AppError('Subtask not found', 404);
    }

    const subtaskIndex = task.subtasks.findIndex((s) => s._id.toString() === sid);
    const updated = await Task.findByIdAndUpdate(
      id,
      { $set: { [`subtasks.${subtaskIndex}.isCompleted`]: !subtask.isCompleted } },
      { new: true }
    );

    return updated!;
  }

  async duplicateTask(userId: string, id: string): Promise<ITask> {
    const original = await Task.findOne({ _id: id, createdBy: userId });
    if (!original) {
      throw new AppError('Task not found', 404);
    }

    const duplicate = await Task.create({
      ...original.toObject(),
      _id: new mongoose.Types.ObjectId(),
      isCompleted: false,
      completedAt: undefined,
      assignedSlot: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return duplicate;
  }

  async getStatistics(userId: string): Promise<TaskStatistics> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const today = new Date().toISOString().split('T')[0];
    const next7Days = this.addDays(today, 7);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      byPriority,
      upcomingTasks,
    ] = await Promise.all([
      Task.countDocuments({ createdBy: userObjectId }),
      Task.countDocuments({ createdBy: userObjectId, isCompleted: true }),
      Task.countDocuments({ createdBy: userObjectId, isCompleted: false }),
      Task.countDocuments({ createdBy: userObjectId, isCompleted: false, dueDate: { $lt: today } }),
      Task.aggregate([
        { $match: { createdBy: userObjectId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        {
          $match: {
            createdBy: userObjectId,
            dueDate: { $gte: today, $lte: next7Days },
            isCompleted: false,
          },
        },
        {
          $group: {
            _id: '$dueDate',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const priorityMap: { high: number; medium: number; low: number } = { high: 0, medium: 0, low: 0 };
    byPriority.forEach((p) => {
      if (p._id in priorityMap) {
        priorityMap[p._id as keyof typeof priorityMap] = p.count;
      }
    });

    const next7DaysData = upcomingTasks.map((t) => ({
      date: t._id,
      count: t.count,
    }));

    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      byPriority: priorityMap,
      next7Days: next7DaysData,
    };
  }

  async importJSON(userId: string, json: any): Promise<{ tasksImported: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (!json.tasks || !Array.isArray(json.tasks)) {
      throw new AppError('Invalid JSON format: missing tasks array', 400);
    }

    await Task.deleteMany({ createdBy: userObjectId });

    const tasksToInsert = json.tasks.map((t: any) => ({
      ...t,
      createdBy: userObjectId,
    }));

    const result = await Task.insertMany(tasksToInsert);
    return { tasksImported: result.length };
  }

  async importICS(userId: string, events: any[]): Promise<{ tasksAdded: number }> {
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
          ...event,
          createdBy: userObjectId,
          type: 'ics-import',
          isCompleted: false,
          assignedSlot: null,
        });
      }
    }

    if (newTasks.length > 0) {
      await Task.insertMany(newTasks);
    }

    return { tasksAdded: newTasks.length };
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

export default new TaskService();
