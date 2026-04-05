import app from './app';
import { env, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeGCPStorage } from './config/gcp-storage';
import { prisma } from './config/database';

// Initialize server
async function startServer() {
  try {
    // Validate environment variables
    validateEnv();

    // Connect to database (필수)
    await connectDatabase();

    // Redis와 GCP Storage는 병렬로 초기화 (선택적, 실패해도 서버 시작)
    await Promise.allSettled([
      connectRedis(),
      initializeGCPStorage(),
    ]);

    // Start server
    const PORT = env.PORT;
    const HOST = '0.0.0.0'; // 모든 네트워크 인터페이스에서 접근 가능하도록 변경

    app.listen(PORT, HOST, () => {
      console.log('=================================');
      console.log(`🚀 Daham VOC Backend Server`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Server running on ${HOST}:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('=================================');
    });

    // DB 연결 keep-alive: 새벽 5~8시(KST)에만 10분마다 예열
    // (사용자가 몰려오기 전에 Supabase pooler 연결을 미리 유지)
    setInterval(async () => {
      const kstHour = (new Date().getUTCHours() + 9) % 24;
      if (kstHour >= 5 && kstHour < 8) {
        try {
          await prisma.$queryRaw`SELECT 1`;
        } catch (e: any) {
          console.error('Keep-alive query failed:', e.message);
        }
      }
    }, 10 * 60 * 1000);
  } catch (error: any) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
});
