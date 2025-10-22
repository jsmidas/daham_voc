import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMockGroups() {
  console.log('🔍 Mock 사업장 그룹 삭제 중...\n');

  // Find groups with 0 sites
  const emptyGroups = await prisma.siteGroup.findMany({
    where: {
      isActive: true,
      sites: {
        none: {}
      }
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    }
  });

  if (emptyGroups.length === 0) {
    console.log('✅ 삭제할 빈 그룹이 없습니다.');
    await prisma.$disconnect();
    return;
  }

  console.log(`📊 발견된 빈 그룹: ${emptyGroups.length}개\n`);

  let deleted = 0;

  for (const group of emptyGroups) {
    console.log(`🗑️  삭제: ${group.name} (ID: ${group.id.substring(0, 8)}..., 생성: ${group.createdAt.toISOString().split('T')[0]})`);

    await prisma.siteGroup.update({
      where: { id: group.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      }
    });

    deleted++;
  }

  console.log(`\n✅ 총 ${deleted}개 그룹 삭제 완료`);

  await prisma.$disconnect();
}

deleteMockGroups().catch((error) => {
  console.error('❌ 오류 발생:', error);
  prisma.$disconnect();
  process.exit(1);
});
