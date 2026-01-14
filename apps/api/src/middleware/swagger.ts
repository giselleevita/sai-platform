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
