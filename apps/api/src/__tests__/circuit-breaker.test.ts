import { CircuitBreaker } from '../infra/circuit-breaker';

describe('CircuitBreaker', () => {
  const logs: Array<{ level: 'info' | 'warn'; msg: string; meta?: Record<string, unknown> }> = [];
  const log = (level: 'info' | 'warn', msg: string, meta?: Record<string, unknown>) => {
    logs.push({ level, msg, meta });
  };

  beforeEach(() => {
    logs.length = 0;
  });

  it('opens after consecutive server failures and rejects while open', () => {
    const b = new CircuitBreaker('test', 2, 60_000, log);
    expect(b.allow()).toBe(true);
    b.recordFailure(true);
    b.recordFailure(true);
    expect(b.snapshot()).toBe('open');
    expect(b.lastTrip()).toBe('threshold');
    expect(b.allow()).toBe(false);
  });

  it('enters half-open after cooldown and closes on success', () => {
    jest.useFakeTimers();
    const b = new CircuitBreaker('test', 2, 1_000, log);
    b.recordFailure(true);
    b.recordFailure(true);
    expect(b.allow()).toBe(false);
    jest.advanceTimersByTime(1_000);
    expect(b.allow()).toBe(true);
    expect(b.snapshot()).toBe('half_open');
    b.recordSuccess();
    expect(b.snapshot()).toBe('closed');
    jest.useRealTimers();
  });

  it('does not count non-server failures toward threshold', () => {
    const b = new CircuitBreaker('test', 2, 60_000, log);
    b.recordFailure(false);
    b.recordFailure(false);
    expect(b.snapshot()).toBe('closed');
  });
});
