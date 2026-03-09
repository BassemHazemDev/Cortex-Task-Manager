import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import settingsService from './settings.service';

export const getSettings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const settings = await settingsService.getSettings(userId);

  res.json({
    status: 'success',
    data: settings,
  });
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const settings = await settingsService.updateSettings(userId, req.body);

  res.json({
    status: 'success',
    data: settings,
  });
});
