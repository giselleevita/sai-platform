import { config } from '../config';
import { logger } from '../utils/logger';
import { CircuitBreaker } from './circuit-breaker';

export type EvidentiaHttpLogFields = {
  integration: 'evidentia';
  companyId?: string;
  saiEvidenceId?: string;
  method: string;
  path: string;
  durationMs: number;
  httpStatus?: number;
  ok: boolean;
  circuit?: 'closed' | 'open' | 'half_open';
  error?: string;
};

const logAdapter = (level: 'info' | 'warn', msg: string, meta?: Record<string, unknown>) => {
  if (level === 'info') logger.info(msg, meta);
  else logger.warn(msg, meta);
};

const breakers = new Map<string, CircuitBreaker>();

function getEvidentiaBreaker(): CircuitBreaker {
  const key = 'evidentia';
  let b = breakers.get(key);
  if (!b) {
    b = new CircuitBreaker(
      key,
      config.evidentia.circuitFailureThreshold,
      config.evidentia.circuitCooldownMs,
      logAdapter
    );
    breakers.set(key, b);
  }
  return b;
}

/** Test hook: reset breaker between tests. */
export function resetEvidentiaCircuitBreakerForTests(): void {
  breakers.delete('evidentia');
}

function isBreakerTripStatus(status: number): boolean {
  if (status >= 500) return true;
  if (status === 429) return true;
  return false;
}

/**
 * Timeout + circuit breaker + structured logs (no secrets).
 * Returns the raw `Response` so callers can parse JSON consistently.
 */
export async function evidentiaIntegrationFetch(
  path: string,
  init: RequestInit,
  log: Omit<EvidentiaHttpLogFields, 'durationMs' | 'httpStatus' | 'ok' | 'circuit' | 'error'>
): Promise<Response> {
  const breaker = getEvidentiaBreaker();
  if (!breaker.allow()) {
    const err = new Error('Evidentia temporarily unavailable (circuit open)');
    logger.warn('integration.evidentia.circuit_reject', {
      ...log,
      durationMs: 0,
      ok: false,
      circuit: breaker.snapshot(),
      error: err.message,
    } satisfies EvidentiaHttpLogFields);
    throw err;
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeoutMs = config.evidentia.httpTimeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const durationMs = Date.now() - started;
    const trip = isBreakerTripStatus(res.status);
    if (res.ok) {
      breaker.recordSuccess();
    } else if (trip) {
      breaker.recordFailure(true);
    }
    logger.info('integration.evidentia.http', {
      ...log,
      durationMs,
      httpStatus: res.status,
      ok: res.ok,
      circuit: breaker.snapshot(),
    } satisfies EvidentiaHttpLogFields);
    return res;
  } catch (e) {
    clearTimeout(timer);
    const durationMs = Date.now() - started;
    breaker.recordFailure(true);
    const message = e instanceof Error ? e.message : String(e);
    logger.warn('integration.evidentia.http_error', {
      ...log,
      durationMs,
      ok: false,
      circuit: breaker.snapshot(),
      error: message,
    } satisfies EvidentiaHttpLogFields);
    throw e;
  }
}
