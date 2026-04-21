import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
  origin: env.NODE_ENV === 'development'
    ? true  // 개발 환경에서는 모든 origin 허용 (localhost:8081, 모바일 앱 등)
    : (env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
// 로그인/회원가입: 15분에 100회 (IP당, 성공한 로그인은 카운트 제외)
// 공유 네트워크(회사/카페)에서 여러 사용자가 사용하는 경우 대응
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true, // 성공한 로그인은 카운트 안 함
  message: { success: false, error: { code: 'RATE_LIMIT', message: '잠시 후 다시 시도해주세요' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// 일반 API: 15분에 500회 (정상 사용 범위)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/v1/auth/'), // auth는 별도 제한
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/register-customer', authLimiter);
app.use('/api/v1', apiLimiter);

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
 
