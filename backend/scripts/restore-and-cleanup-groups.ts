import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreAndCleanup() {
  console.log('🔄 사업장 그룹 복구 및 정리 중...\n');

  // 1. Restore recently deleted groups (도시락, 운반, 요양원, 학교)
  console.log('📦 삭제된 그룹 복구 중...');
  const recentlyDeleted = await prisma.siteGroup.findMany({
    where: {
      isActive: false,
      deletedAt: { not: null },
      createdAt: { gte: new Date('2025-10-21') }
    },
    select: { id: true, name: true }
  });

  for (const group of recentlyDeleted) {
    await prisma.siteGroup.update({
      where: { id: group.id },
      data: {
        isActive: true,
        deletedAt: null,
      }
    });
    console.log(`  ✅ 복구: ${group.name}`);
  }

  console.log(`\n📊 총 ${recentlyDeleted.length}개 그룹 복구 완료\n`);

  // 2. Delete mock groups (서울권역, 영남권역 - created on 2025-10-16)
  console.log('🗑️  Mock 데이터 삭제 중...');
  const mockGroups = await prisma.siteGroup.findMany({
    where: {
      isActive: true,
      createdAt: { lt: new Date('2025-10-21') }
    },
    select: { id: true, name: true, createdAt: true }
  });

  for (const group of mockGroups) {
    await prisma.siteGroup.update({
      where: { id: group.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      }
    });
    console.log(`  🗑️  삭제: ${group.name} (생성: ${group.createdAt.toISOString().split('T')[0]})`);
  }

  console.log(`\n✅ 총 ${mockGroups.length}개 Mock 그룹 삭제 완료`);

  await prisma.$disconnect();
}

restoreAndCleanup().catch((error) => {
  console.error('❌ 오류 발생:', error);
  prisma.$disconnect();
  process.exit(1);
});
