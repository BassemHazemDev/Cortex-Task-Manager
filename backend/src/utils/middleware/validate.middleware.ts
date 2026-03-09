import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { AppError } from '../handlers/appError';

export const validate = (schema: ZodObject<any>) => {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: _req.body,
        query: _req.query,
        params: _req.params,
      });

      _req.body = parsed.body;
      _req.query = parsed.query as any;
      _req.params = parsed.params as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as any;
        const issues = zodError.issues || [];
        const errorIssues = issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError(errorIssues.map((i: any) => `${i.field}: ${i.message}`).join(', '), 400));
      }
      next(error);
    }
  };
};
