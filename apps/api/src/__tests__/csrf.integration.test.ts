import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { csrfProtection, generateCsrfToken } from '../middleware/csrf';

function createTestApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.post('/protected', csrfProtection, (req, res) => {
    res.status(200).json({ success: true });
  });
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err?.statusCode || 500).json({ error: err?.message || 'Unhandled error' });
  });
  return app;
}

describe('CSRF middleware integration (HTTP)', () => {
  it('returns 401 when CSRF header is missing', async () => {
    const app = createTestApp();
    const response = await request(app)
      .post('/protected')
      .set('Cookie', [`csrf-token=${generateCsrfToken()}`])
      .send({ ok: true });

    expect(response.status).toBe(401);
    expect(response.body?.error).toBe('Invalid CSRF token');
  });

  it('returns 200 when header and cookie token match', async () => {
    const app = createTestApp();
    const csrfToken = generateCsrfToken();

    const response = await request(app)
      .post('/protected')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [`csrf-token=${csrfToken}`])
      .send({ ok: true });

    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
  });
});
