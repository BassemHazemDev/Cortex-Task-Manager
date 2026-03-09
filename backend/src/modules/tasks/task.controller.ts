import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import taskService from './task.service';
import type { CreateTaskInput, UpdateTaskInput, TaskQuery } from './task.types';

export const getAll = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as TaskQuery;
  const userId = req.user!._id.toString();

  const result = await taskService.findAll(userId, query);

  res.json({
    status: 'success',
    results: result.tasks.length,
    data: result.tasks,
    pagination: {
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    },
  });
});

export const getStatistics = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const stats = await taskService.getStatistics(userId);

  res.json({
    status: 'success',
    data: stats,
  });
});

export const findById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const task = await taskService.findById(userId, id);

  res.json({
    status: 'success',
    data: task,
  });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as CreateTaskInput;
  const userId = req.user!._id.toString();
  const result = await taskService.create(userId, data);

  if (result.task) {
    res.status(201).json({
      status: 'success',
      data: result.task,
    });
  } else if (result.tasks) {
    res.status(201).json({
      status: 'success',
      tasksAdded: result.tasksAdded,
      data: result.tasks,
    });
  } else {
    res.status(201).json({
      status: 'success',
      tasksAdded: result.tasksAdded,
    });
  }
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = req.body as UpdateTaskInput;
  const userId = req.user!._id.toString();
  const task = await taskService.update(userId, id, data);

  res.json({
    status: 'success',
    data: task,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const task = await taskService.delete(userId, id);

  res.json({
    status: 'success',
    data: task,
  });
});

export const toggleComplete = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const task = await taskService.toggleComplete(userId, id);

  res.json({
    status: 'success',
    data: task,
  });
});

export const bulkComplete = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user!._id.toString();
  const count = await taskService.bulkComplete(userId, ids);

  res.json({
    status: 'success',
    count,
  });
});

export const bulkDelete = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user!._id.toString();
  const count = await taskService.bulkDelete(userId, ids);

  res.json({
    status: 'success',
    count,
  });
});

export const dropReschedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { newDate } = req.body as { newDate: string };
  const userId = req.user!._id.toString();
  const task = await taskService.dropReschedule(userId, id, newDate);

  res.json({
    status: 'success',
    data: task,
  });
});

export const assignSlot = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { date, time } = req.body as { date: string; time: string };
  const userId = req.user!._id.toString();
  const task = await taskService.assignSlot(userId, id, { date, time });

  res.json({
    status: 'success',
    data: task,
  });
});

export const duplicateTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const task = await taskService.duplicateTask(userId, id);

  res.status(201).json({
    status: 'success',
    data: task,
  });
});

export const addSubtask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { title } = req.body as { title: string };
  const userId = req.user!._id.toString();
  const task = await taskService.addSubtask(userId, id, { title });

  res.status(201).json({
    status: 'success',
    data: task,
  });
});

export const updateSubtask = catchAsync(async (req: Request, res: Response) => {
  const { id, sid } = req.params as { id: string; sid: string };
  const updates = req.body as { title?: string; isCompleted?: boolean };
  const userId = req.user!._id.toString();
  const task = await taskService.updateSubtask(userId, id, sid, updates);

  res.json({
    status: 'success',
    data: task,
  });
});

export const deleteSubtask = catchAsync(async (req: Request, res: Response) => {
  const { id, sid } = req.params as { id: string; sid: string };
  const userId = req.user!._id.toString();
  const task = await taskService.deleteSubtask(userId, id, sid);

  res.json({
    status: 'success',
    data: task,
  });
});

export const toggleSubtaskComplete = catchAsync(async (req: Request, res: Response) => {
  const { id, sid } = req.params as { id: string; sid: string };
  const userId = req.user!._id.toString();
  const task = await taskService.toggleSubtaskComplete(userId, id, sid);

  res.json({
    status: 'success',
    data: task,
  });
});
