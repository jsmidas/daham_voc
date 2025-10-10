import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GCP_PROJECT_ID: string;
  GCP_BUCKET_NAME: string;
  GCP_KEY_FILE: string;
  MAX_IMAGE_SIZE: number;
  ALLOWED_IMAGE_TYPES: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || '',
  GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME || '',
  GCP_KEY_FILE: process.env.GCP_KEY_FILE || '',
  MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE || '10485760', 10),
  ALLOWED_IMAGE_TYPES: process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  console.log('✅ Environment variables validated');
}
