const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const counts = await Promise.all([
      prisma.site.count(),
      prisma.menuType.count(),
      prisma.user.count(),
      prisma.siteGroup.count()
    ]);

    console.log('✅ Supabase 연결 성공!');
    console.log('Site:', counts[0], '개');
    console.log('MenuType:', counts[1], '개');
    console.log('User:', counts[2], '개');
    console.log('SiteGroup:', counts[3], '개');

    await prisma.$disconnect();
  } catch(e) {
    console.error('❌ 연결 실패:', e.message);
    process.exit(1);
  }
})();
