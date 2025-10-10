import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Create Prisma Client instance
const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Connect to PostgreSQL database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully');
  } catch (error: any) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Disconnect from PostgreSQL database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('PostgreSQL disconnected');
  } catch (error: any) {
    console.error('Error disconnecting from PostgreSQL:', error.message);
  }
}

// Export Prisma client
export { prisma };
