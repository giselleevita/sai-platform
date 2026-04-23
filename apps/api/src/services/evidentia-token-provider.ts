import { prisma } from './prisma.client';
import { config } from '../config';
import { logger } from '../utils/logger';

export type EvidentiaTenantAuth = {
  evidentiaTenantId: string;
  bearerToken: string;
  source: 'company_link' | 'global_fallback';
};

type CacheEntry = { value: EvidentiaTenantAuth | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

function envLookup(secretRef: string): string | null {
  const key = secretRef.trim();
  if (!key) return null;
  const value = process.env[key];
  return value?.trim() ? value.trim() : null;
}

/**
 * Phase 1: resolve per-company Evidentia token/tenant mapping.
 *
 * We intentionally store **only** `secretRef` in the DB; runtime resolves the actual token.
 * Current implementation supports `STATIC_JWT_ENVREF` where `secretRef` is an env var name.
 */
export class EvidentiaTokenProvider {
  static async resolve(companyId: string): Promise<EvidentiaTenantAuth | null> {
    const cached = cache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const link = await prisma.companyEvidentiaLink.findUnique({
      where: { companyId },
      select: { evidentiaTenantId: true, authMode: true, secretRef: true },
    });

    if (link) {
      const token = envLookup(link.secretRef);
      if (token) {
        const resolved: EvidentiaTenantAuth = {
          evidentiaTenantId: link.evidentiaTenantId,
          bearerToken: token,
          source: 'company_link',
        };
        cache.set(companyId, { value: resolved, expiresAt: Date.now() + CACHE_TTL_MS });
        return resolved;
      }
      logger.warn('integration.evidentia.token_missing', {
        integration: 'evidentia',
        companyId,
        authMode: link.authMode,
        secretRef: link.secretRef,
      });
    }

    if (config.evidentia.requireCompanyLink) {
      cache.set(companyId, { value: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    // Backward-compatible fallback while deployments migrate to tenant-scoped credentials.
    if (config.evidentia.serviceBearerToken) {
      const resolved: EvidentiaTenantAuth = {
        evidentiaTenantId: 'global',
        bearerToken: config.evidentia.serviceBearerToken,
        source: 'global_fallback',
      };
      cache.set(companyId, { value: resolved, expiresAt: Date.now() + CACHE_TTL_MS });
      return resolved;
    }

    cache.set(companyId, { value: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }
}

