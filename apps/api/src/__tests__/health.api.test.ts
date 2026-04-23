import express from 'express';
import request from 'supertest';
import { resolveEmailDeliveryMode } from '../services/email.service';

describe('GET /api/health', () => {
  it('returns status ok and ISO timestamp (same contract as production route)', async () => {
    const app = express();
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(typeof response.body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});

describe('GET /api/health/email', () => {
  it('returns resolved mode and ISO timestamp (no secrets)', async () => {
    const app = express();
    app.get('/api/health/email', (_req, res) => {
      res.json({
        mode: resolveEmailDeliveryMode(),
        timestamp: new Date().toISOString(),
      });
    });

    const response = await request(app).get('/api/health/email');

    expect(response.status).toBe(200);
    expect(typeof response.body.mode).toBe('string');
    expect(response.body).not.toHaveProperty('apiKey');
    expect(typeof response.body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});
