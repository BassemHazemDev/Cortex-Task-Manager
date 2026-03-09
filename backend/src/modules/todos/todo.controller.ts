import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import todoService from './todo.service';

export const findAll = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const todos = await todoService.findAll(userId);

  res.json({
    status: 'success',
    results: todos.length,
    data: todos,
  });
});

export const findById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const todo = await todoService.findById(userId, id);

  res.json({
    status: 'success',
    data: todo,
  });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.user!._id.toString();
  const todo = await todoService.create(userId, data);

  res.status(201).json({
    status: 'success',
    data: todo,
  });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updates = req.body;
  const userId = req.user!._id.toString();
  const todo = await todoService.update(userId, id, updates);

  res.json({
    status: 'success',
    data: todo,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const todo = await todoService.delete(userId, id);

  res.json({
    status: 'success',
    data: todo,
  });
});

export const toggleComplete = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const todo = await todoService.toggleComplete(userId, id);

  res.json({
    status: 'success',
    data: todo,
  });
});

export const reorder = catchAsync(async (req: Request, res: Response) => {
  const { activeId, overId } = req.body as { activeId: string; overId: string };
  const userId = req.user!._id.toString();
  await todoService.reorder(userId, activeId, overId);

  res.json({
    status: 'success',
  });
});
