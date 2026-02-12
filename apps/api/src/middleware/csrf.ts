import { Request, Response, NextFunction } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';
import { UnauthorizedError } from '../errors/AppError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function isValidTokenFormat(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

function tokensMatch(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(left), Buffer.from(right));
  } catch {
    return false;
  }
}

/**
 * CSRF Protection Middleware
 * Validates CSRF token from header against session token
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  // Get CSRF token from header
  const headerValue = req.headers['x-csrf-token'];
  const csrfToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const sessionToken = req.cookies?.['csrf-token'];

  if (
    typeof csrfToken !== 'string' ||
    typeof sessionToken !== 'string' ||
    !isValidTokenFormat(csrfToken) ||
    !isValidTokenFormat(sessionToken) ||
    !tokensMatch(csrfToken, sessionToken)
  ) {
    throw new UnauthorizedError('Invalid CSRF token');
  }

  next();
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}
