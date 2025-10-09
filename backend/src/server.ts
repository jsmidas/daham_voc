import app from './app';
import { env, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeGCPStorage } from './config/gcp-storage';

// Initialize server
async function startServer() {
  try {
    // Validate environment variables
    validateEnv();

    // Connect to database
    await connectDatabase();

    // Connect to Redis (optional)
    await connectRedis();

    // Initialize GCP Storage (optional)
    initializeGCPStorage();

    // Start server
    const PORT = env.PORT;

    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Daham VOC Backend Server`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('=================================');
    });
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
