const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 기존 설정을 새로운 형식으로 변환
 * - deadlineHoursBefore + startTime => deadline 시간으로 변환
 */
async function migrateSettings() {
  try {
    const settings = await prisma.mealCountSetting.findMany({
      include: { site: { select: { name: true } } }
    });

    console.log(`총 ${settings.length}개 설정을 마이그레이션합니다...\n`);

    for (const setting of settings) {
      const updates = {};
      const hoursBefore = setting.deadlineHoursBefore || 24;

      // 조식 마감시간 계산
      if (setting.breakfastStartTime) {
        updates.breakfastDeadline = calculateDeadline(setting.breakfastStartTime, hoursBefore);
      }

      // 중식 마감시간 계산
      if (setting.lunchStartTime) {
        updates.lunchDeadline = calculateDeadline(setting.lunchStartTime, hoursBefore);
      }

      // 석식 마감시간 계산
      if (setting.dinnerStartTime) {
        updates.dinnerDeadline = calculateDeadline(setting.dinnerStartTime, hoursBefore);
      }

      // 야식은 기존에 마감시간이 있다면 유지
      if (setting.supperDeadline) {
        updates.supperDeadline = setting.supperDeadline;
      }

      console.log(`${setting.site.name}:`);
      console.log(`  조식: ${updates.breakfastDeadline || '-'}`);
      console.log(`  중식: ${updates.lunchDeadline || '-'}`);
      console.log(`  석식: ${updates.dinnerDeadline || '-'}`);
      console.log(`  야식: ${updates.supperDeadline || '-'}\n`);

      // DB 업데이트는 주석 처리 - 먼저 확인만
      // await prisma.mealCountSetting.update({
      //   where: { id: setting.id },
      //   data: updates
      // });
    }

    console.log('✅ 마이그레이션 계획 확인 완료');
    console.log('실제 적용하려면 주석을 해제하세요');

    await prisma.$disconnect();
  } catch (error) {
    console.error('에러:', error.message);
    process.exit(1);
  }
}

function calculateDeadline(startTime, hoursBefore) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const deadline = new Date();
  deadline.setHours(hours, minutes, 0, 0);
  deadline.setHours(deadline.getHours() - hoursBefore);

  const deadlineHours = deadline.getHours().toString().padStart(2, '0');
  const deadlineMinutes = deadline.getMinutes().toString().padStart(2, '0');

  return `${deadlineHours}:${deadlineMinutes}`;
}

migrateSettings();
