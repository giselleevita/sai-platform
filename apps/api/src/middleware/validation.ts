import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Validation middleware factory
 * Creates middleware that validates request body/query/params against a Zod schema
 */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body) as any;
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        (error as any).issues.forEach((issue: any) => {
          const path = issue.path.join('.');
          if (!fields[path]) {
            fields[path] = [];
          }
          fields[path].push(issue.message);
        });
        throw new ValidationError('Validation failed', fields);
      }
      throw error;
    }
  };
}
