import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  AUDIT_PAGE_SIZE_DEFAULT,
  AUDIT_PAGE_SIZE_MAX,
  AuditLogQuery,
  AuditLogService,
} from '../services/audit-log.service';

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function parseDate(value: unknown, endOfDay: boolean): Date | undefined {
  const raw = firstString(value);
  if (!raw) return undefined;
  // A bare date from a date input means the whole of that day, and an
  // auditor filtering "to 3 September" means through the end of it.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : raw;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function parseAuditQuery(query: Record<string, unknown>): AuditLogQuery {
  const rawLimit = Number(firstString(query.limit));
  return {
    action: firstString(query.action),
    targetType: firstString(query.targetType),
    actorId: firstString(query.actorId),
    from: parseDate(query.from, false),
    to: parseDate(query.to, true),
    cursor: firstString(query.cursor),
    limit: Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.trunc(rawLimit), AUDIT_PAGE_SIZE_MAX)
      : AUDIT_PAGE_SIZE_DEFAULT,
  };
}

export class AuditController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const page = await AuditLogService.search(companyId, parseAuditQuery(req.query ?? {}));
    res.json({ success: true, data: page.entries, meta: { nextCursor: page.nextCursor } });
  }

  static async facets(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.json({ success: true, data: await AuditLogService.facets(companyId) });
  }
}
