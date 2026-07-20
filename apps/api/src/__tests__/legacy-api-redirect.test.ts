import express from 'express';
import request from 'supertest';

describe('legacy /api/* redirect to /api/v1/*', () => {
  it('redirects with 307 and preserves path + query', async () => {
    const app = express();

    app.use('/api', (req, res, next) => {
      if (req.path.startsWith('/health') || req.path === '/api-docs') return next();
      if (req.path.startsWith('/scim')) return next();
      if (req.path.startsWith('/v1')) return next();
      const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
      res.redirect(307, `/api/v1${req.path}${qs}`);
    });

    app.get('/api/v1/foo', (req, res) => {
      res.json({ ok: true, query: req.query });
    });

    const res = await request(app).get('/api/foo?limit=5&x=y');
    expect(res.status).toBe(307);
    expect(res.headers.location).toBe('/api/v1/foo?limit=5&x=y');
  });

  it('does not redirect /api/health', async () => {
    const app = express();
    app.use('/api', (req, res, next) => {
      if (req.path.startsWith('/health') || req.path === '/api-docs') return next();
      if (req.path.startsWith('/scim')) return next();
      if (req.path.startsWith('/v1')) return next();
      const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
      res.redirect(307, `/api/v1${req.path}${qs}`);
    });
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

