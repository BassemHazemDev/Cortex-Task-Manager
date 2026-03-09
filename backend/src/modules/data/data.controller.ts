import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import dataService from './data.service';

export const exportAll = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const data = await dataService.exportAll(userId);

  res.json({
    status: 'success',
    data,
  });
});

export const importJSON = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const json = req.body;
  const result = await dataService.importJSON(userId, json);

  res.json({
    status: 'success',
    ...result,
  });
});

export const importICS = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const fileContent = req.body.file;
  const result = await dataService.importICS(userId, fileContent);

  res.json({
    status: 'success',
    ...result,
  });
});
