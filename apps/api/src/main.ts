import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config';
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import governanceRoutes from './routes/governance';
import riskRoutes from './routes/risks';
import evidenceRoutes from './routes/evidence';
import incidentRoutes from './routes/incidents';
import auditRoutes from './routes/audit';
import auditLogRoutes from './routes/audit-log';
import exceptionRoutes from './routes/exceptions';
import vendorRoutes from './routes/vendors';
import pricingRoutes from './routes/pricing';
import reportRoutes from './routes/reports';
import bulkRoutes from './routes/bulk';
import activityRoutes from './routes/activity';
import commentsRoutes from './routes/comments';
import importExportRoutes from './routes/import-export';
import webhooksRoutes from './routes/webhooks';
import mlIntegrationRoutes from './routes/ml-integrations';
import gpaiRoutes from './routes/gpai';
import conformityRoutes from './routes/conformity';
import invitationsRoutes from './routes/invitations';
import usersRoutes from './routes/users';
import integrationsRoutes from './routes/integrations';
import scimRoutes from './routes/scim';
import entitlementsRoutes from './routes/entitlements';
import { errorHandler } from './middleware';
import { apiRateLimiter } from './middleware/rateLimit';
import { securityAuditMiddleware } from './middleware/securityAudit';
import { csrfProtection } from './middleware/csrf';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils';
import { isOidcConfigured } from './services/oidc.config';
import { resolveEmailDeliveryMode } from './services/email.service';
import { ScheduledReportsService } from './modules/reports';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: config.nodeEnv === 'production' ? config.cors.origin : true, // Allow all in dev
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (add request IDs)
app.use(requestLogger);
app.use(securityAuditMiddleware);

// Public: OIDC configured? (lets the web UI show "Sign in with SSO" without a second env flag)
app.get('/api/health/oidc', (_req, res) => {
  res.json({ oidcEnabled: isOidcConfigured() });
});

// Public: liveness for probes that expect a path under /api (same shape as GET /health)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public: resolved email delivery mode (no secrets — for ops / staging checks)
app.get('/api/health/email', (_req, res) => {
  res.json({
    mode: resolveEmailDeliveryMode(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/metrics', (_req, res) => {
  const m = process.memoryUsage();
  res.json({
    uptimeSeconds: process.uptime(),
    rssBytes: m.rss,
    heapUsedBytes: m.heapUsed,
    heapTotalBytes: m.heapTotal,
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting (apply to all routes)
app.use('/api', apiRateLimiter);

// SCIM endpoints are typically called server-to-server.
app.use('/scim/v2', scimRoutes);

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'SAI Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      oidcProbe: '/api/health/oidc',
      emailProbe: '/api/health/email',
      metrics: '/api/health/metrics',
      integrations: '/api/v1/integrations',
      apiDocs: '/api-docs',
      auth: '/api/auth',
      inventory: '/api/inventory',
      governance: '/api/governance',
      risks: '/api/risks',
      evidence: '/api/evidence',
      incidents: '/api/incidents',
      audit: '/api/audit',
      exceptions: '/api/exceptions',
      vendors: '/api/vendors',
      mlIntegrations: '/api/ml-integrations',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation (Swagger/OpenAPI)
app.get('/api-docs', (req, res) => {
  const { swaggerDocs } = require('./middleware/swagger');
  swaggerDocs(req, res, () => {});
});

// API versioning - support both /api and /api/v1
const apiV1Routes = express.Router();

// API routes (v1)
apiV1Routes.use('/auth', authRoutes);
// Apply CSRF protection to all authenticated routes (except auth)
// Note: CSRF middleware is applied per-route, not globally, to allow auth endpoints
apiV1Routes.use('/inventory', csrfProtection, inventoryRoutes);
apiV1Routes.use('/governance', csrfProtection, governanceRoutes);
apiV1Routes.use('/risks', csrfProtection, riskRoutes);
apiV1Routes.use('/evidence', csrfProtection, evidenceRoutes);
apiV1Routes.use('/incidents', csrfProtection, incidentRoutes);
apiV1Routes.use('/audit', csrfProtection, auditRoutes);
apiV1Routes.use('/audit-log', csrfProtection, auditLogRoutes);
apiV1Routes.use('/exceptions', csrfProtection, exceptionRoutes);
apiV1Routes.use('/vendors', csrfProtection, vendorRoutes);
apiV1Routes.use('/pricing', csrfProtection, pricingRoutes);
apiV1Routes.use('/reports', csrfProtection, reportRoutes);
apiV1Routes.use('/bulk', csrfProtection, bulkRoutes);
apiV1Routes.use('/activity', csrfProtection, activityRoutes);
apiV1Routes.use('/comments', csrfProtection, commentsRoutes);
apiV1Routes.use('/import-export', csrfProtection, importExportRoutes);
apiV1Routes.use('/webhooks', csrfProtection, webhooksRoutes);
apiV1Routes.use('/ml-integrations', csrfProtection, mlIntegrationRoutes);
apiV1Routes.use('/gpai', csrfProtection, gpaiRoutes);
apiV1Routes.use('/conformity', csrfProtection, conformityRoutes);
apiV1Routes.use('/invitations', csrfProtection, invitationsRoutes);
apiV1Routes.use('/users', csrfProtection, usersRoutes);
apiV1Routes.use('/integrations', csrfProtection, integrationsRoutes);
apiV1Routes.use('/entitlements', csrfProtection, entitlementsRoutes);

// Mount v1 routes
app.use('/api/v1', apiV1Routes);

// Legacy routes (backward compatibility - redirect to v1)
app.use('/api/auth', authRoutes);
app.use('/api/inventory', csrfProtection, inventoryRoutes);
app.use('/api/governance', csrfProtection, governanceRoutes);
app.use('/api/risks', csrfProtection, riskRoutes);
app.use('/api/evidence', csrfProtection, evidenceRoutes);
app.use('/api/incidents', csrfProtection, incidentRoutes);
app.use('/api/audit', csrfProtection, auditRoutes);
app.use('/api/audit-log', csrfProtection, auditLogRoutes);
app.use('/api/exceptions', csrfProtection, exceptionRoutes);
app.use('/api/vendors', csrfProtection, vendorRoutes);
app.use('/api/pricing', csrfProtection, pricingRoutes);
app.use('/api/reports', csrfProtection, reportRoutes);
app.use('/api/bulk', csrfProtection, bulkRoutes);
app.use('/api/activity', csrfProtection, activityRoutes);
app.use('/api/comments', csrfProtection, commentsRoutes);
app.use('/api/import-export', csrfProtection, importExportRoutes);
app.use('/api/webhooks', csrfProtection, webhooksRoutes);
app.use('/api/ml-integrations', csrfProtection, mlIntegrationRoutes);
app.use('/api/gpai', csrfProtection, gpaiRoutes);
app.use('/api/conformity', csrfProtection, conformityRoutes);
app.use('/api/invitations', csrfProtection, invitationsRoutes);
app.use('/api/users', csrfProtection, usersRoutes);
app.use('/api/integrations', csrfProtection, integrationsRoutes);
app.use('/api/entitlements', csrfProtection, entitlementsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`✅ API server running on http://localhost:${config.port}`);
  if (process.env.RUN_SCHEDULED_REPORTS !== 'false') {
    ScheduledReportsService.initializeAllReports().catch((error) => {
      logger.error('Failed to initialize scheduled reports:', error);
    });
  } else {
    logger.info('Scheduled reports disabled for this process (RUN_SCHEDULED_REPORTS=false)');
  }
});
