/**
 * The audit trail is evidence. Two failures here would not look like
 * failures on screen: a page that silently drops the tail of the history,
 * and a filter that quietly widens to another tenant's records.
 */
const findManyCalls: { model: string; args: any }[] = [];
let auditRows: any[] = [];

jest.mock('../services/prisma.client', () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, model: string) => ({
        findMany: (args: any) => {
          findManyCalls.push({ model, args });
          if (model === 'auditLog') return Promise.resolve(auditRows);
          return Promise.resolve([]);
        },
        create: (args: any) => Promise.resolve(args.data),
      }),
    },
  ),
}));

import {
  AUDIT_PAGE_SIZE_DEFAULT,
  AUDIT_PAGE_SIZE_MAX,
  AuditLogService,
} from '../services/audit-log.service';
import { parseAuditQuery } from '../controllers/audit.controller';

const COMPANY = 'company-1';

const row = (id: string) => ({ id, action: 'risk.create', targetType: 'Risk', createdAt: new Date() });

beforeEach(() => {
  findManyCalls.length = 0;
  auditRows = [];
});

describe('AuditLogService.search', () => {
  it('scopes every query to the calling company', async () => {
    await AuditLogService.search(COMPANY, { action: 'risk.create' });
    const call = findManyCalls.find((c) => c.model === 'auditLog');
    expect(call?.args.where.companyId).toBe(COMPANY);
  });

  it('asks for one more row than the page, so it can tell whether more exist', async () => {
    await AuditLogService.search(COMPANY, { limit: 10 });
    expect(findManyCalls[0].args.take).toBe(11);
  });

  it('returns a cursor only when there is another page', async () => {
    auditRows = [row('a'), row('b'), row('c')];
    const full = await AuditLogService.search(COMPANY, { limit: 2 });
    expect(full.entries.map((e: any) => e.id)).toEqual(['a', 'b']);
    expect(full.nextCursor).toBe('b');

    auditRows = [row('a'), row('b')];
    const last = await AuditLogService.search(COMPANY, { limit: 2 });
    expect(last.entries).toHaveLength(2);
    expect(last.nextCursor).toBeNull();
  });

  it('skips the cursor row itself, so a page does not repeat the last entry', async () => {
    await AuditLogService.search(COMPANY, { cursor: 'entry-9' });
    expect(findManyCalls[0].args.cursor).toEqual({ id: 'entry-9' });
    expect(findManyCalls[0].args.skip).toBe(1);
  });

  it('orders newest first with a stable tiebreak', async () => {
    await AuditLogService.search(COMPANY, {});
    expect(findManyCalls[0].args.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
  });

  it('omits filters that were not asked for', async () => {
    await AuditLogService.search(COMPANY, {});
    const where = findManyCalls[0].args.where;
    expect(where).toEqual({ companyId: COMPANY });
  });

  it('applies each filter that was asked for', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-02-01T00:00:00.000Z');
    await AuditLogService.search(COMPANY, {
      action: 'risk.update',
      targetType: 'Risk',
      actorId: 'user-3',
      from,
      to,
    });
    expect(findManyCalls[0].args.where).toEqual({
      companyId: COMPANY,
      action: 'risk.update',
      targetType: 'Risk',
      actorId: 'user-3',
      createdAt: { gte: from, lte: to },
    });
  });

  it('caps the page size, so a caller cannot ask for the whole table', async () => {
    await AuditLogService.search(COMPANY, { limit: 100000 });
    expect(findManyCalls[0].args.take).toBe(AUDIT_PAGE_SIZE_MAX + 1);
  });

  it('refuses a zero or negative page size rather than returning nothing forever', async () => {
    await AuditLogService.search(COMPANY, { limit: 0 });
    expect(findManyCalls[0].args.take).toBe(2);
  });
});

describe('AuditLogService.facets', () => {
  it('only offers actors from the calling company', async () => {
    auditRows = [{ actorId: 'user-1' }];
    await AuditLogService.facets(COMPANY);
    const userCall = findManyCalls.find((c) => c.model === 'user');
    expect(userCall?.args.where.companyId).toBe(COMPANY);
    expect(userCall?.args.where.id).toEqual({ in: ['user-1'] });
  });
});

describe('parseAuditQuery', () => {
  it('defaults the page size when none is given', () => {
    expect(parseAuditQuery({}).limit).toBe(AUDIT_PAGE_SIZE_DEFAULT);
  });

  it('ignores blank and non-string values instead of filtering on them', () => {
    const parsed = parseAuditQuery({ action: '   ', targetType: ['Risk'], actorId: undefined });
    expect(parsed.action).toBeUndefined();
    expect(parsed.targetType).toBeUndefined();
    expect(parsed.actorId).toBeUndefined();
  });

  it('reads a bare "to" date as the end of that day', () => {
    const parsed = parseAuditQuery({ from: '2026-03-01', to: '2026-03-01' });
    expect(parsed.from?.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(parsed.to?.toISOString()).toBe('2026-03-01T23:59:59.999Z');
  });

  it('drops an unparseable date rather than filtering on Invalid Date', () => {
    expect(parseAuditQuery({ from: 'last tuesday' }).from).toBeUndefined();
  });

  it('caps a limit supplied in the query string', () => {
    expect(parseAuditQuery({ limit: '5000' }).limit).toBe(AUDIT_PAGE_SIZE_MAX);
  });
});
