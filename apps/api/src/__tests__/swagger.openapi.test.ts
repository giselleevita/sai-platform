import type { Request, Response } from 'express';
import { swaggerDocs } from '../middleware/swagger';

describe('OpenAPI /api-docs payload', () => {
  it('returns 3.0 spec with inventory governance paths', () => {
    const req = {} as Request;
    const json = jest.fn();
    const res = { json } as unknown as Response;
    const next = jest.fn();

    swaggerDocs(req, res, next);

    expect(json).toHaveBeenCalledTimes(1);
    const doc = json.mock.calls[0][0] as {
      openapi: string;
      paths: Record<string, unknown>;
      components?: { schemas?: Record<string, unknown> };
    };

    expect(doc.openapi).toBe('3.0.0');
    expect(doc.paths['/api/inventory/{id}/governance']).toBeDefined();
    expect(doc.paths['/api/inventory/{id}/decisions']).toBeDefined();
    expect(doc.components?.schemas?.ToolGovernancePatch).toBeDefined();
    expect(doc.components?.schemas?.ToolDecisionLogCreate).toBeDefined();
  });
});
