import { prisma } from './prisma.client';

type CacheEntry = { expiresAt: number; value: Map<string, { valueInt: number | null; valueBool: boolean | null }> };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000;

export class EntitlementsService {
  static async getCompanyEntitlements(companyId: string) {
    const cached = cache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const rows = await prisma.companyEntitlement.findMany({
      where: { companyId },
      select: { key: true, valueInt: true, valueBool: true },
    });
    const map = new Map(rows.map((r) => [r.key, { valueInt: r.valueInt ?? null, valueBool: r.valueBool ?? null }]));
    cache.set(companyId, { value: map, expiresAt: Date.now() + TTL_MS });
    return map;
  }

  static async getInt(companyId: string, key: string): Promise<number | null> {
    const ents = await this.getCompanyEntitlements(companyId);
    const v = ents.get(key)?.valueInt ?? null;
    return typeof v === 'number' ? v : null;
  }

  static async getBool(companyId: string, key: string): Promise<boolean | null> {
    const ents = await this.getCompanyEntitlements(companyId);
    const v = ents.get(key)?.valueBool ?? null;
    return typeof v === 'boolean' ? v : null;
  }
}

