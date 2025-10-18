/**
 * Cleanup script: Delete all soft-deleted site groups
 * This allows recreating groups with the same name
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for soft-deleted site groups...');

  // Find all soft-deleted groups
  const deletedGroups = await prisma.siteGroup.findMany({
    where: {
      isActive: false,
    },
    select: {
      id: true,
      name: true,
      division: true,
      deletedAt: true,
    },
  });

  if (deletedGroups.length === 0) {
    console.log('✅ No soft-deleted groups found. Nothing to clean up.');
    return;
  }

  console.log(`📋 Found ${deletedGroups.length} soft-deleted group(s):`);
  deletedGroups.forEach((group) => {
    console.log(`  - ${group.name} (${group.division}) - Deleted at: ${group.deletedAt}`);
  });

  console.log('\n🗑️  Permanently deleting these groups from database...');

  // Hard delete all soft-deleted groups
  const result = await prisma.siteGroup.deleteMany({
    where: {
      isActive: false,
    },
  });

  console.log(`✅ Successfully deleted ${result.count} group(s)`);
  console.log('✨ You can now create groups with the same names again!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
