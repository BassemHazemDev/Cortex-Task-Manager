import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../database/models/user.model';
import { AppError } from '../handlers/appError';
import env from '../../config/environment';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; iat: number; exp: number };

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Token is no longer valid', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};
