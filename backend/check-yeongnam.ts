import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  console.log('=== 영남지사 사업장 (119개) ===');
  const yeongnamSites = await prisma.site.findMany({
    where: { division: 'YEONGNAM' },
    include: {
      group: true,
      siteMenuTypes: {
        include: {
          menuType: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  yeongnamSites.forEach((site, idx) => {
    const menuNames = site.siteMenuTypes.map((sm: any) => sm.menuType.name).join(', ');
    console.log(`${idx + 1}. ${site.name} | 그룹: ${site.group?.name} | 메뉴: ${menuNames}`);
  });

  const groupCounts = await prisma.site.groupBy({
    by: ['groupId'],
    where: { division: 'YEONGNAM' },
    _count: true
  });

  console.log('\n=== 영남지사 그룹별 개수 ===');
  for (const item of groupCounts) {
    const group = await prisma.siteGroup.findUnique({
      where: { id: item.groupId || '' }
    });
    console.log(`${group?.name || '그룹 없음'}: ${item._count}개`);
  }

  await prisma.$disconnect();
}

check();
