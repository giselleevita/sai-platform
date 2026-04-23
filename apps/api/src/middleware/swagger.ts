import { Request, Response, NextFunction } from 'express';

/**
 * Swagger/OpenAPI documentation endpoint
 * Returns API documentation in OpenAPI 3.0 format
 */
export function swaggerDocs(req: Request, res: Response, next: NextFunction) {
  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'SAI Platform API',
      version: '1.0.0',
      description: 'Secure AI Integration Platform API',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'API Server',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/inventory': {
        get: {
          summary: 'Get AI tools',
          tags: ['Inventory'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'List of tools' },
          },
        },
      },
      '/api/inventory/{id}/governance': {
        parameters: [{ $ref: '#/components/parameters/InventoryToolId' }],
        get: {
          summary: 'Get governance profile for an AI tool',
          description:
            'Returns merged profile: persisted data from `AITool.customFields.toolGovernance.profile` when set, otherwise demo fallback by tool name.',
          tags: ['Inventory'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Governance profile for the tool' },
            '404': { description: 'Tool not found' },
          },
        },
        patch: {
          summary: 'Persist governance profile fields for an AI tool',
          description:
            'Merges into stored JSON under `customFields.toolGovernance.profile`. Requires TOOL_WRITE.',
          tags: ['Inventory'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ToolGovernancePatch' },
              },
            },
          },
          responses: {
            '200': { description: 'Updated profile' },
            '404': { description: 'Tool not found' },
          },
        },
      },
      '/api/inventory/{id}/decisions': {
        parameters: [{ $ref: '#/components/parameters/InventoryToolId' }],
        get: {
          summary: 'List tool-scoped decision log entries',
          description:
            'Free-form decision history stored on the tool (`customFields.toolGovernance.decisionLogs`), not the Risk `DecisionLog` table.',
          tags: ['Inventory'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Array of decision entries (newest first)' },
          },
        },
        post: {
          summary: 'Append a decision log entry',
          tags: ['Inventory'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ToolDecisionLogCreate' },
              },
            },
          },
          responses: {
            '201': { description: 'Created entry' },
            '404': { description: 'Tool not found' },
          },
        },
      },
      '/api/risks': {
        get: {
          summary: 'Get risks',
          tags: ['Risks'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of risks' },
          },
        },
      },
      '/api/activity': {
        get: {
          summary: 'Get activity feed',
          tags: ['Activity'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Activity feed' },
          },
        },
      },
      '/api/comments/{type}/{id}': {
        get: {
          summary: 'Get comments',
          tags: ['Comments'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of comments' },
          },
        },
      },
      '/api/import-export/tools/excel': {
        get: {
          summary: 'Export tools to Excel',
          tags: ['Import/Export'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Excel file',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
              },
            },
          },
        },
      },
    },
    components: {
      parameters: {
        InventoryToolId: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'AI tool id',
          schema: { type: 'string' },
        },
      },
      schemas: {
        ToolGovernancePatch: {
          type: 'object',
          additionalProperties: false,
          properties: {
            decisionStatus: { type: 'string', maxLength: 500 },
            decisionOwner: { type: 'string', maxLength: 500 },
            decisionOwnerRole: { type: 'string', maxLength: 500 },
            decisionRationale: { type: 'string', maxLength: 4000 },
            decisionExpiresAt: { type: 'string', maxLength: 100 },
            reviewDate: { type: 'string', maxLength: 100 },
            applicablePolicies: { type: 'array', items: { type: 'string' } },
            complianceStatus: { type: 'string', maxLength: 500 },
          },
        },
        ToolDecisionLogCreate: {
          type: 'object',
          required: ['decision'],
          properties: {
            decision: { type: 'string' },
            rationale: { type: 'string' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };

  res.json(docs);
}
