import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://sai_user:sai_password@localhost:5432/sai_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
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
