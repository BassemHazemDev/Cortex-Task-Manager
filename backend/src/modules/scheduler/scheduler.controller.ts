import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import schedulerService from './scheduler.service';

export const suggestSlots = catchAsync(async (req: Request, res: Response) => {
  const { taskId, maxSuggestions } = req.body;
  const userId = req.user!._id.toString();
  const suggestions = await schedulerService.suggestSlots(userId, taskId, maxSuggestions);

  res.json({
    status: 'success',
    data: suggestions,
  });
});

export const optimizeUnscheduled = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const suggestions = await schedulerService.optimizeUnscheduled(userId);

  res.json({
    status: 'success',
    data: suggestions,
  });
});

export const getOverdueSuggestions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const suggestions = await schedulerService.getOverdueSuggestions(userId);

  res.json({
    status: 'success',
    data: suggestions,
  });
});

export const checkConflicts = catchAsync(async (req: Request, res: Response) => {
  const { taskId, proposedDate, proposedTime } = req.body;
  const userId = req.user!._id.toString();
  const conflicts = await schedulerService.checkConflicts(userId, taskId, proposedDate, proposedTime);

  res.json({
    status: 'success',
    data: conflicts,
  });
});
