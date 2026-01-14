import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/AppError';

/**
 * CSRF Protection Middleware
 * Validates CSRF token from header against session token
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionToken = req.cookies['csrf-token'];

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    throw new UnauthorizedError('Invalid CSRF token');
  }

  next();
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}
