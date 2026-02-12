import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DATABASE_URL = 'postgresql://sai_user:sai_password@localhost:5432/sai_db';
const INSECURE_JWT_SECRETS = new Set([
  'change-me-in-prod',
  'your-secret-key-change-in-production',
]);

function parsePort(rawPort: string | undefined): number {
  const port = Number(rawPort || '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value \"${rawPort}\". Expected an integer between 1 and 65535.`);
  }
  return port;
}

function requireDatabaseUrl(rawUrl: string | undefined): string {
  const databaseUrl = rawUrl?.trim() || DEFAULT_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Set it in apps/api/.env before starting the API.');
  }
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
  }
  return databaseUrl;
}

function resolveJwtSecret(nodeEnv: string, rawSecret: string | undefined): string {
  const jwtSecret = rawSecret?.trim();

  if (nodeEnv === 'production') {
    if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret)) {
      throw new Error(
        'JWT_SECRET must be set to a strong, non-default value in production. Update apps/api/.env.',
      );
    }
    return jwtSecret;
  }

  if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret)) {
    console.warn(
      '[WARN] JWT_SECRET is using a default development value. Set a custom value in apps/api/.env.',
    );
    return 'dev-insecure-jwt-secret-change-me';
  }

  return jwtSecret;
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port: parsePort(process.env.PORT),
  nodeEnv,
  database: {
    url: requireDatabaseUrl(process.env.DATABASE_URL),
  },
  jwt: {
    secret: resolveJwtSecret(nodeEnv, process.env.JWT_SECRET),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  mfa: {
    issuer: process.env.MFA_ISSUER || 'SAI Platform',
    window: Number(process.env.MFA_WINDOW || '1'),
  },
} as const;
