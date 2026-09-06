/**
 * Every list a tenant can ask for must be scoped to that tenant.
 *
 * The existing scope tests cover one service each. This one is table driven,
 * so a service added to the table is covered without another near-identical
 * file, and a list method that forgets companyId fails here rather than in
 * front of a customer looking at somebody else's data.
 */
const mockPrismaCalls: { model: string; method: string; args: any }[] = [];

jest.mock('../services/prisma.client', () => {
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, method: string) =>
          (...args: any[]) => {
            mockPrismaCalls.push({ model: name, method, args: args[0] });
            if (method === 'count') return Promise.resolve(0);
            if (method.startsWith('findUnique') || method.startsWith('findFirst')) {
              return Promise.resolve(null);
            }
            return Promise.resolve([]);
          },
      },
    );

  return {
    prisma: new Proxy(
      {},
      {
        get: (_target, name: string) => {
          if (name === '$transaction') {
            return (operations: any) =>
              Array.isArray(operations) ? Promise.all(operations) : operations({});
          }
          return model(name);
        },
      },
    ),
  };
});

jest.mock('../services/cache.service', () => ({
  CacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  },
}));

import { AuditLogService } from '../services/audit-log.service';
import { GpaiService } from '../services/gpai.service';
import { InvitationsService } from '../services/invitations.service';
import { MLIntegrationService } from '../services/ml-integration.service';
import { PricingService } from '../services/pricing.service';
import { UsersService } from '../services/users.service';
import { WebhooksService } from '../services/webhooks.service';

const COMPANY = 'cmp_tenant_scope_probe';

const LISTS: { name: string; run: () => Promise<unknown> }[] = [
  { name: 'AuditLogService.list', run: () => AuditLogService.list(COMPANY) },
  { name: 'GpaiService.list', run: () => GpaiService.list(COMPANY) },
  { name: 'InvitationsService.listInvitations', run: () => InvitationsService.listInvitations(COMPANY) },
  { name: 'MLIntegrationService.listByCompany', run: () => MLIntegrationService.listByCompany(COMPANY) },
  { name: 'PricingService.listQuoteRequests', run: () => PricingService.listQuoteRequests(COMPANY) },
  { name: 'UsersService.listUsers', run: () => UsersService.listUsers(COMPANY) },
  { name: 'WebhooksService.listWebhooks', run: () => WebhooksService.listWebhooks(COMPANY) },
];

function whereMentionsCompany(value: unknown): boolean {
  if (value === COMPANY) return true;
  if (Array.isArray(value)) return value.some(whereMentionsCompany);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(whereMentionsCompany);
  }
  return false;
}

describe.each(LISTS)('$name', ({ run }) => {
  beforeEach(() => {
    mockPrismaCalls.length = 0;
  });

  it('scopes its query to the company it was asked about', async () => {
    await run();

    const reads = mockPrismaCalls.filter((call) => call.method.startsWith('find'));
    expect(reads.length).toBeGreaterThan(0);

    for (const read of reads) {
      expect({
        model: read.model,
        method: read.method,
        scoped: whereMentionsCompany(read.args?.where),
      }).toEqual({ model: read.model, method: read.method, scoped: true });
    }
  });
});
