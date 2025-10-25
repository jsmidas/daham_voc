import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const divisionCounts = await prisma.site.groupBy({
    by: ['division'],
    _count: true
  });

  console.log('=== 부문별 사업장 수 ===');
  for (const item of divisionCounts) {
    console.log(`${item.division}: ${item._count}개`);
  }

  const hqSites = await prisma.site.findMany({
    where: { division: 'HQ' },
    include: {
      group: true,
      siteMenuTypes: {
        include: {
          menuType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('\n=== 본사(HQ) 사업장 샘플 (최근 10개) ===');
  hqSites.forEach(site => {
    const menuNames = site.siteMenuTypes.map((sm: any) => sm.menuType.name).join(', ');
    console.log(`- ${site.name} | 그룹: ${site.group?.name} | 메뉴: ${menuNames}`);
  });

  await prisma.$disconnect();
}

check();
