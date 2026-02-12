import { Request, Response, NextFunction } from 'express';
import { csrfProtection, generateCsrfToken } from '../middleware/csrf';

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    headers: {},
    cookies: {},
    ...overrides,
  } as Request;
}

describe('CSRF middleware', () => {
  let res: Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    res = {} as Response;
    next = jest.fn();
  });

  it('skips CSRF check for safe methods', () => {
    const req = createRequest({ method: 'GET' });
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing CSRF header token', () => {
    const req = createRequest({
      method: 'POST',
      cookies: { 'csrf-token': generateCsrfToken() },
    });
    expect(() => csrfProtection(req, res, next)).toThrow('Invalid CSRF token');
  });

  it('rejects invalid token format', () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'x-csrf-token': 'short' },
      cookies: { 'csrf-token': 'also-short' },
    });
    expect(() => csrfProtection(req, res, next)).toThrow('Invalid CSRF token');
  });

  it('rejects mismatched tokens', () => {
    const req = createRequest({
      method: 'POST',
      headers: { 'x-csrf-token': generateCsrfToken() },
      cookies: { 'csrf-token': generateCsrfToken() },
    });
    expect(() => csrfProtection(req, res, next)).toThrow('Invalid CSRF token');
  });

  it('accepts matching tokens', () => {
    const token = generateCsrfToken();
    const req = createRequest({
      method: 'POST',
      headers: { 'x-csrf-token': token },
      cookies: { 'csrf-token': token },
    });

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('generateCsrfToken', () => {
  it('returns random 64-char hex tokens', () => {
    const tokenA = generateCsrfToken();
    const tokenB = generateCsrfToken();

    expect(tokenA).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenB).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenA).not.toBe(tokenB);
  });
});
