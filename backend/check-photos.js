const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.mealPhoto.findMany({
    where: { capturedAt: { gte: new Date('2025-12-05') } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { site: { select: { name: true } } }
  });

  console.log('오늘 업로드된 사진:', photos.length, '개');
  photos.forEach(p => {
    console.log(`- ${p.id} | ${p.site?.name} | ${p.photoType} | ${p.capturedAt}`);
  });
}

main().finally(() => prisma.$disconnect());
