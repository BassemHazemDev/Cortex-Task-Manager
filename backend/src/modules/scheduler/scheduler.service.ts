import { User } from '../../database/models/user.model';
import { Task } from '../../database/models/task.model';
import { AppError } from '../../utils/handlers/appError';
import { suggestOptimalSlots, autoReschedule, checkConflicts } from '../../utils/scheduler/schedulerUtils';

const EXCLUDED_TAGS = ['lecture', 'section', 'meeting', 'deadline', 'course'];

class SchedulerService {
  async suggestSlots(userId: string, taskId: string, maxSuggestions?: number) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const task = await Task.findOne({ _id: taskId, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const allTasks = await Task.find({ createdBy: userId, isCompleted: false });

    const suggestions = suggestOptimalSlots(
      {
        _id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        assignedSlot: task.assignedSlot,
        tags: task.tags,
      } as any,
      allTasks as any,
      user.settings.availableHours,
      maxSuggestions || 3
    );

    return suggestions;
  }

  async optimizeUnscheduled(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const unscheduledTasks = await Task.find({
      createdBy: userId,
      isCompleted: false,
      assignedSlot: null,
      tags: { $nin: EXCLUDED_TAGS },
    });

    const allTasks = await Task.find({ createdBy: userId, isCompleted: false });

    const suggestions = [];
    for (const task of unscheduledTasks) {
      const result = autoReschedule(
        {
          _id: task._id,
          title: task.title,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          assignedSlot: task.assignedSlot,
          tags: task.tags,
        } as any,
        allTasks as any,
        user.settings.availableHours
      );

      if (result.success && result.newSlot) {
        suggestions.push({
          taskId: task._id,
          taskTitle: task.title,
          suggestedSlot: result.newSlot,
          reason: result.reason,
        });
      }
    }

    return suggestions.filter((s) => s.reason && parseInt(s.reason.replace('Score: ', '')) > 70);
  }

  async getOverdueSuggestions(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = await Task.find({
      createdBy: userId,
      isCompleted: false,
      dueDate: { $lt: today },
    });

    const allTasks = await Task.find({ createdBy: userId, isCompleted: false });

    const suggestions = [];
    for (const task of overdueTasks) {
      const result = autoReschedule(
        {
          _id: task._id,
          title: task.title,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          assignedSlot: task.assignedSlot,
          tags: task.tags,
        } as any,
        allTasks as any,
        user.settings.availableHours
      );

      if (result.success && result.newSlot) {
        suggestions.push({
          taskId: task._id,
          taskTitle: task.title,
          currentDueDate: task.dueDate,
          suggestedSlot: result.newSlot,
          reason: result.reason,
        });
      }
    }

    return suggestions;
  }

  async checkConflicts(userId: string, taskId: string, proposedDate: string, proposedTime: string) {
    const task = await Task.findOne({ _id: taskId, createdBy: userId });
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const allTasks = await Task.find({ createdBy: userId, isCompleted: false });

    const conflicts = checkConflicts(
      {
        _id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        assignedSlot: task.assignedSlot,
        tags: task.tags,
      } as any,
      proposedDate,
      proposedTime,
      allTasks as any
    );

    return conflicts.map((t) => ({
      id: t._id,
      title: t.title,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
    }));
  }
}

export default new SchedulerService();
