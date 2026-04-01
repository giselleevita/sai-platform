import { NextFunction, Response } from 'express';

import { AuthenticatedRequest } from './auth';
import { RequestWithId } from './requestLogger';
import { AuditLogService } from '../services/audit-log.service';
import { logger } from '../utils/logger';

type SecurityAuditRequest = AuthenticatedRequest & RequestWithId;

function actionFor(req: SecurityAuditRequest, statusCode: number): string | null {
  const path = req.path;

  if (statusCode === 429) {
    return 'security.rate_limit.blocked';
  }
  if (statusCode === 401) {
    return 'security.auth.unauthorized';
  }
  if (statusCode === 403) {
    return 'security.auth.forbidden';
  }

  if (path.endsWith('/auth/login') && statusCode >= 200 && statusCode < 300) {
    return 'security.auth.login.success';
  }
  if (path.endsWith('/auth/refresh') && statusCode >= 200 && statusCode < 300) {
    return 'security.auth.refresh.success';
  }
  if (path.endsWith('/auth/logout') && statusCode >= 200 && statusCode < 300) {
    return 'security.auth.logout.success';
  }
  if (path.includes('/auth/mfa/') && statusCode >= 200 && statusCode < 300) {
    return 'security.auth.mfa.event';
  }

  return null;
}

export function securityAuditMiddleware(req: SecurityAuditRequest, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    if (!req.path.startsWith('/api')) {
      return;
    }

    const action = actionFor(req, res.statusCode);
    if (!action) {
      return;
    }

    const companyId = req.user?.companyId;
    const actorId = req.user?.id;
    const durationMs = Date.now() - startedAt;
    const event = {
      action,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
      durationMs,
    };

    if (!companyId) {
      logger.warn('Security event without company scope', event);
      return;
    }

    void AuditLogService.log({
      companyId,
      actorId,
      action,
      targetType: 'security_event',
      targetId: req.requestId,
      changes: event,
    }).catch((error) => {
      logger.error('Failed to persist security audit event', {
        ...event,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  next();
}
