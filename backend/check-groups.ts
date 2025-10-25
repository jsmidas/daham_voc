import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const groups = await prisma.siteGroup.findMany({
    orderBy: [{ division: 'asc' }, { name: 'asc' }]
  });

  console.log('=== 모든 사업장 그룹 ===');
  groups.forEach(g => {
    console.log(`[${g.division}] ${g.name} (ID: ${g.id})`);
  });

  await prisma.$disconnect();
}

check();
