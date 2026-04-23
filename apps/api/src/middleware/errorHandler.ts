import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';

function safeJsonForLogs(value: unknown, maxLen = 2000): unknown {
  if (value === undefined) return undefined;
  try {
    const s = JSON.stringify(value);
    if (s.length <= maxLen) return value;
    return { truncated: true, length: s.length };
  } catch {
    return { unserializable: true };
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { 
      statusCode: err.statusCode, 
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
    });
    
    const response: any = {
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        path: req.path,
        method: req.method,
      }),
    };
    
    if (err instanceof ValidationError && err.fields) {
      response.fields = err.fields;
      response.error = 'Validation failed. Please check the fields below.';
    }
    
    return res.status(err.statusCode).json(response);
  }

  // Unexpected errors
  logger.error('Unexpected error:', err, {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    ...(process.env.NODE_ENV === 'development'
      ? {
          body: safeJsonForLogs(req.body),
          query: safeJsonForLogs(req.query),
        }
      : {}),
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later or contact support if the problem persists.'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      path: req.path,
      method: req.method,
    }),
  });
};
