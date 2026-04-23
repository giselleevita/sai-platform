import { config } from '../config';
import { logger } from '../utils/logger';
import { evidentiaIntegrationFetch, type EvidentiaHttpLogFields } from '../infra/evidentia-http';
import { EvidentiaTokenProvider } from './evidentia-token-provider';

type EvidentiaApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
};

export type EvidentiaEvidenceDto = {
  id: string;
  title: string;
  description: string;
  type: string;
  sourceSystem: string;
  owner: string;
  status: string;
  references?: Record<string, string>;
};

function baseUrl(): string | null {
  const raw = config.evidentia.evidenceBaseUrl;
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

async function bearer(companyId?: string): Promise<string | null> {
  if (companyId) {
    const resolved = await EvidentiaTokenProvider.resolve(companyId);
    return resolved?.bearerToken || null;
  }
  return config.evidentia.serviceBearerToken || null;
}

export async function isEvidentiaGovernanceConfigured(companyId?: string): Promise<boolean> {
  const token = await bearer(companyId);
  return Boolean(baseUrl() && token);
}

type EvidentiaLogContext = Pick<EvidentiaHttpLogFields, 'companyId' | 'saiEvidenceId'>;

async function evidentiaFetch<T>(
  relativePath: string,
  init: RequestInit = {},
  logCtx: EvidentiaLogContext = {}
): Promise<T> {
  const root = baseUrl();
  const token = await bearer(logCtx.companyId);
  if (!root || !token) {
    throw new Error('Evidentia governance is not configured (EVIDENTIA_EVIDENCE_BASE_URL + EVIDENTIA_SERVICE_BEARER_TOKEN).');
  }
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const url = `${root}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const method = (init.method || 'GET').toUpperCase();
  const res = await evidentiaIntegrationFetch(
    url,
    { ...init, headers },
    {
      integration: 'evidentia',
      companyId: logCtx.companyId,
      saiEvidenceId: logCtx.saiEvidenceId,
      method,
      path,
    }
  );
  const text = await res.text();
  let parsed: EvidentiaApiResponse<T> | T | null = null;
  try {
    parsed = text ? (JSON.parse(text) as EvidentiaApiResponse<T> | T) : null;
  } catch {
    throw new Error(`Evidentia returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg =
      (parsed as EvidentiaApiResponse<T>)?.message ||
      (parsed as EvidentiaApiResponse<T>)?.errors?.toString?.() ||
      text.slice(0, 300);
    throw new Error(`Evidentia HTTP ${res.status}: ${msg}`);
  }
  if (parsed && typeof parsed === 'object' && 'data' in (parsed as object)) {
    return (parsed as EvidentiaApiResponse<T>).data as T;
  }
  return parsed as T;
}

export class EvidentiaGovernanceService {
  static async ping(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    if (!(await isEvidentiaGovernanceConfigured())) {
      return { ok: false, latencyMs: 0, error: 'not_configured' };
    }
    const started = Date.now();
    try {
      await evidentiaFetch<unknown[]>('/api/v1/evidence', { method: 'GET' }, {});
      return { ok: true, latencyMs: Date.now() - started };
    } catch (e) {
      logger.warn('Evidentia ping failed', e);
      return { ok: false, latencyMs: Date.now() - started, error: (e as Error).message };
    }
  }

  static async pingForCompany(companyId: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    if (!(await isEvidentiaGovernanceConfigured(companyId))) {
      return { ok: false, latencyMs: 0, error: 'not_configured' };
    }
    const started = Date.now();
    try {
      await evidentiaFetch<unknown[]>('/api/v1/evidence', { method: 'GET' }, { companyId });
      return { ok: true, latencyMs: Date.now() - started };
    } catch (e) {
      logger.warn('Evidentia ping failed', e);
      return { ok: false, latencyMs: Date.now() - started, error: (e as Error).message };
    }
  }

  static async listEvidence(logCtx?: EvidentiaLogContext): Promise<EvidentiaEvidenceDto[]> {
    const data = await evidentiaFetch<EvidentiaEvidenceDto[]>('/api/v1/evidence', { method: 'GET' }, logCtx ?? {});
    return Array.isArray(data) ? data : [];
  }

  static async createGovernedEvidence(
    input: {
      title: string;
      description: string;
      type: string;
      sourceSystem: string;
      owner: string;
      references?: Record<string, string>;
    },
    logCtx?: EvidentiaLogContext
  ): Promise<EvidentiaEvidenceDto> {
    return evidentiaFetch<EvidentiaEvidenceDto>(
      '/api/v1/evidence',
      {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          type: input.type,
          sourceSystem: input.sourceSystem,
          owner: input.owner,
          references: input.references ?? {},
        }),
      },
      logCtx ?? {}
    );
  }

  static async submitForReview(evidentiaId: string, logCtx?: EvidentiaLogContext): Promise<EvidentiaEvidenceDto> {
    return evidentiaFetch<EvidentiaEvidenceDto>(
      `/api/v1/evidence/${evidentiaId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
      logCtx ?? {}
    );
  }

  static async approve(evidentiaId: string, note?: string, logCtx?: EvidentiaLogContext): Promise<EvidentiaEvidenceDto> {
    return evidentiaFetch<EvidentiaEvidenceDto>(
      `/api/v1/evidence/${evidentiaId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ note: note ?? 'Approved via SAI governance' }),
      },
      logCtx ?? {}
    );
  }
}
