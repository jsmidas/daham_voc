/**
 * Remove duplicate sites script
 * Keeps the oldest site and removes newer duplicates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log('🔍 중복 사업장 검색 중...\n');

  const sites = await prisma.site.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      address: true,
      type: true,
      division: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Group by name
  const grouped = new Map<string, any[]>();
  for (const site of sites) {
    if (!grouped.has(site.name)) {
      grouped.set(site.name, []);
    }
    grouped.get(site.name)!.push(site);
  }

  // Find duplicates
  const duplicates: any[] = [];
  for (const [name, group] of grouped.entries()) {
    if (group.length > 1) {
      duplicates.push({
        name,
        count: group.length,
        sites: group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      });
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ 중복된 사업장이 없습니다.');
    await prisma.$disconnect();
    return;
  }

  console.log(`📊 중복 그룹 발견: ${duplicates.length}개\n`);

  let removed = 0;
  let kept = 0;

  for (const duplicate of duplicates) {
    console.log(`\n[${duplicate.name}] - 총 ${duplicate.count}개`);

    // Keep the oldest (first created) site
    const [keep, ...toRemove] = duplicate.sites;
    kept++;

    console.log(`  ✅ 유지: ${keep.id.substring(0, 8)}... (생성: ${new Date(keep.createdAt).toISOString().split('T')[0]})`);

    // Soft delete the duplicates
    for (const site of toRemove) {
      await prisma.site.update({
        where: { id: site.id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
      removed++;
      console.log(`  🗑️  삭제: ${site.id.substring(0, 8)}... (생성: ${new Date(site.createdAt).toISOString().split('T')[0]})`);
    }
  }

  console.log(`\n\n=== 완료 ===`);
  console.log(`✅ 유지된 사업장: ${kept}개`);
  console.log(`🗑️  삭제된 사업장: ${removed}개`);
  console.log(`📊 중복 그룹 수: ${duplicates.length}개`);

  await prisma.$disconnect();
}

removeDuplicates().catch((error) => {
  console.error('❌ 오류 발생:', error);
  prisma.$disconnect();
  process.exit(1);
});
