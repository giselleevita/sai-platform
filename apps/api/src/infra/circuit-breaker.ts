type BreakerState = 'closed' | 'open' | 'half_open';

export type BreakerTripReason = 'threshold' | 'half_open_probe_failed';

/**
 * Minimal circuit breaker: counts server-side failures; opens; half-open probe after cooldown.
 */
export class CircuitBreaker {
  private state: BreakerState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;
  private lastTripReason: BreakerTripReason | null = null;

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number,
    private readonly cooldownMs: number,
    private readonly log: (level: 'info' | 'warn', msg: string, meta?: Record<string, unknown>) => void
  ) {}

  snapshot(): BreakerState {
    return this.state;
  }

  lastTrip(): BreakerTripReason | null {
    return this.lastTripReason;
  }

  allow(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = 'half_open';
        this.log('warn', `integration.${this.name}.circuit_half_open`, { integration: this.name });
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.state !== 'closed') {
      this.log('info', `integration.${this.name}.circuit_closed`, { integration: this.name });
    }
    this.state = 'closed';
  }

  recordFailure(isServerSide: boolean): void {
    if (!isServerSide) return;
    this.consecutiveFailures += 1;
    if (this.state === 'half_open') {
      this.tripOpen('half_open_probe_failed');
      return;
    }
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.tripOpen('threshold');
    }
  }

  private tripOpen(reason: BreakerTripReason): void {
    this.state = 'open';
    this.openedAt = Date.now();
    this.lastTripReason = reason;
    this.log('warn', `integration.${this.name}.circuit_open`, {
      integration: this.name,
      reason,
      consecutiveFailures: this.consecutiveFailures,
    });
  }
}
