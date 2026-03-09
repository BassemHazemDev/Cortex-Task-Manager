import { Request, Response } from 'express';
import { catchAsync } from '../../utils/handlers/catchAsync';
import authService from './auth.service';
import type { RegisterInput, LoginInput, RefreshTokenInput } from './auth.types';

export const register = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as RegisterInput;
  const { user, token, refreshToken } = await authService.register(data);

  res.status(201).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as LoginInput;
  const { user, token, refreshToken } = await authService.login(data);

  res.json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.user!._id.toString());

  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as RefreshTokenInput;
  const { token, refreshToken } = await authService.refreshAccessToken(data.refreshToken);

  res.json({
    status: 'success',
    token,
    refreshToken,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!._id.toString());

  res.json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
      },
    },
  });
});
