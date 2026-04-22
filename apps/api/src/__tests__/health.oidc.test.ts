import express from 'express';
import request from 'supertest';
import { isOidcConfigured } from '../services/oidc.config';

describe('GET /api/health/oidc', () => {
  it('returns oidcEnabled as a boolean (same helper as production route)', async () => {
    const app = express();
    app.get('/api/health/oidc', (_req, res) => {
      res.json({ oidcEnabled: isOidcConfigured() });
    });

    const response = await request(app).get('/api/health/oidc');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('oidcEnabled');
    expect(typeof response.body.oidcEnabled).toBe('boolean');
  });
});
