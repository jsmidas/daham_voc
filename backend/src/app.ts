import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';

// Create Express app
const app: Application = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock storage (개발 환경) - 정적 파일 서빙
app.use('/mock-images', express.static(path.join(process.cwd(), 'mock-images')));

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Daham VOC API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API v1 routes
import apiRoutes from './routes';
app.use('/api/v1', apiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

export default app;
