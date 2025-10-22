import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDivisionColumn() {
  try {
    console.log('🔧 Adding division column to MenuType table...\n');

    // Check if column already exists
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'MenuType' AND column_name = 'division'
    `;

    if (result.length > 0) {
      console.log('✅ Division column already exists!');
      return;
    }

    // Add division column
    await prisma.$executeRaw`
      ALTER TABLE "MenuType"
      ADD COLUMN "division" TEXT NOT NULL DEFAULT 'HQ'
    `;

    console.log('✅ Division column added successfully!');

    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "MenuType_division_idx" ON "MenuType"("division")
    `;

    console.log('✅ Index created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDivisionColumn();
