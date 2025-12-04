import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 모든 FeedbackImage 레코드 확인
  const allImages = await prisma.feedbackImage.findMany();
  console.log('Total FeedbackImage records:', allImages.length);

  // 최근 VOC 확인
  const recentFeedbacks = await prisma.customerFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { images: true, site: { select: { name: true } } }
  });

  console.log('\nRecent 5 feedbacks:');
  recentFeedbacks.forEach((f, i) => {
    console.log(`${i+1}. ${f.site?.name} - ${f.content?.substring(0, 30)} | images: ${f.images?.length || 0} | createdAt: ${f.createdAt}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
