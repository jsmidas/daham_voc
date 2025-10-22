import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listSiteGroups() {
  const groups = await prisma.siteGroup.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: { select: { sites: true } }
    },
    orderBy: { name: 'asc' }
  });

  console.log('=== 사업장 그룹 목록 ===\n');
  groups.forEach((g, i) => {
    console.log(`${i+1}. ${g.name}`);
    console.log(`   ID: ${g.id.substring(0, 8)}...`);
    console.log(`   설명: ${g.description || '(없음)'}`);
    console.log(`   사업장 수: ${g._count.sites}개`);
    console.log(`   생성일: ${g.createdAt.toISOString().split('T')[0]}\n`);
  });
  console.log(`총 ${groups.length}개 그룹`);

  await prisma.$disconnect();
}

listSiteGroups().catch(console.error);
