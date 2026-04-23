import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

// Simple UUID v4 alternative using crypto
function generateRequestId(): string {
  return randomBytes(16).toString('hex');
}

export interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Request logging middleware
 * Adds request ID and logs all requests
 */
export function requestLogger(req: RequestWithId, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = generateRequestId();
  req.requestId = requestId;

  // Add request ID to response header
  res.setHeader('X-Request-ID', requestId);

  // Log request start
  const startTime = Date.now();
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    queryKeys: Object.keys(req.query || {}),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
