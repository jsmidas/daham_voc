const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const [siteCount, settingCount, settings] = await Promise.all([
      prisma.site.count({ where: { isActive: true } }),
      prisma.mealCountSetting.count(),
      prisma.mealCountSetting.findMany({
        include: {
          site: {
            select: { name: true, division: true }
          }
        }
      })
    ]);

    console.log('=== 식수 마감시간 설정 현황 ===');
    console.log('사업장 개수:', siteCount, '개');
    console.log('설정된 마감시간 개수:', settingCount, '개');
    console.log('차이:', siteCount - settingCount, '개 사업장 미설정\n');

    console.log('=== 설정된 사업장 샘플 (최대 10개) ===');
    settings.slice(0, 10).forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.site.name} (${s.site.division})`);
      console.log(`   - 조: ${s.breakfastStartTime || '-'} | 중: ${s.lunchStartTime || '-'} | 석: ${s.dinnerStartTime || '-'}`);
      console.log(`   - 메뉴개수 조/중/석/야: ${s.breakfastMenuCount}/${s.lunchMenuCount}/${s.dinnerMenuCount}/${s.supperMenuCount}`);
      console.log(`   - 마감: ${s.deadlineHoursBefore || 24}시간 전 | 활성: ${s.isActive ? 'Y' : 'N'}\n`);
    });

    if (settings.length > 10) {
      console.log(`... 외 ${settings.length - 10}개 사업장 설정됨`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('에러:', error.message);
    process.exit(1);
  }
})();
