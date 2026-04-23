/**
 * Regression guard: incident list queries must always include tenant (company) scope.
 */
jest.mock('../services/prisma.client', () => ({
  prisma: {
    incident: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

import { IncidentService } from '../services/incident.service';
import { prisma } from '../services/prisma.client';

describe('IncidentService tenant scope', () => {
  beforeEach(() => {
    jest.mocked(prisma.incident.findMany).mockClear();
    jest.mocked(prisma.incident.count).mockClear();
  });

  it('passes companyId into Prisma where for list', async () => {
    await IncidentService.list('cmp_incident_scope_1');
    expect(prisma.incident.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'cmp_incident_scope_1',
          deletedAt: null,
        }),
      }),
    );
    expect(prisma.incident.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'cmp_incident_scope_1' }),
      }),
    );
  });
});
