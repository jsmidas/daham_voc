import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const routes = await prisma.deliveryRoute.findMany({
    orderBy: [{ division: 'asc' }, { name: 'asc' }]
  });

  console.log('=== 배송코스 목록 ===\n');

  const hqRoutes = routes.filter(r => r.division === 'HQ');
  const yeongnamRoutes = routes.filter(r => r.division === 'YEONGNAM');

  console.log(`본사 배송코스 (${hqRoutes.length}개):`);
  hqRoutes.forEach(r => {
    console.log(`  - ${r.name} (색상: ${r.color}, 모양: ${r.markerShape})`);
  });

  console.log(`\n영남지사 배송코스 (${yeongnamRoutes.length}개):`);
  yeongnamRoutes.forEach(r => {
    console.log(`  - ${r.name} (색상: ${r.color}, 모양: ${r.markerShape})`);
  });

  await prisma.$disconnect();
}

check();
