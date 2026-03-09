import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import templateService from './template.service';

export const findAll = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const templates = await templateService.findAll(userId);

  res.json({
    status: 'success',
    results: templates.length,
    data: templates,
  });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.user!._id.toString();
  const template = await templateService.create(userId, data);

  res.status(201).json({
    status: 'success',
    data: template,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const userId = req.user!._id.toString();
  const template = await templateService.delete(userId, id);

  res.json({
    status: 'success',
    data: template,
  });
});
