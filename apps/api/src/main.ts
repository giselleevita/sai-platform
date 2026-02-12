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
import { errorHandler } from './middleware';
import { apiRateLimiter } from './middleware/rateLimit';
import { csrfProtection } from './middleware/csrf';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils';

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

// Rate limiting (apply to all routes)
app.use('/api', apiRateLimiter);

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'SAI Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      inventory: '/api/inventory',
      governance: '/api/governance',
      risks: '/api/risks',
      evidence: '/api/evidence',
      incidents: '/api/incidents',
      audit: '/api/audit',
      exceptions: '/api/exceptions',
      vendors: '/api/vendors',
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

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`✅ API server running on http://localhost:${config.port}`);
});
