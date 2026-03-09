import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './appError';
import env from '../../config/environment';

interface ErrorResponse {
  status: string;
  statusCode?: number;
  message: string;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: ErrorResponse = {
    status: 'error',
    message: err.message,
  };

  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    const validationErr = err as any;
    error.message = Object.values(validationErr.errors || {})
      .map((e: any) => e.message)
      .join(', ');
  }

  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = 'Invalid ID format';
  }

  if ((err as any).code === 11000) {
    error.statusCode = 409;
    error.message = 'Duplicate field value';
  }

  if (err instanceof jwt.JsonWebTokenError) {
    error.statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err instanceof jwt.TokenExpiredError) {
    error.statusCode = 401;
    error.message = 'Token expired';
  }

  if (err instanceof AppError) {
    error.statusCode = err.statusCode;
    error.message = err.message;
  }

  if (env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(error.statusCode || 500).json({
    status: error.status,
    message: error.message,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
