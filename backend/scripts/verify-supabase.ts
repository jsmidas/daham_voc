import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Verifying Supabase data...\n');

    const userCount = await prisma.user.count();
    const siteGroupCount = await prisma.siteGroup.count();
    const siteCount = await prisma.site.count();
    const staffCount = await prisma.staff.count();
    const menuCount = await prisma.menu.count();

    console.log('📊 Data in Supabase:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Site Groups: ${siteGroupCount}`);
    console.log(`- Sites: ${siteCount}`);
    console.log(`- Staff: ${staffCount}`);
    console.log(`- Menus: ${menuCount}`);

    if (siteCount > 0) {
      console.log('\n🏢 Sample sites:');
      const sites = await prisma.site.findMany({
        take: 5,
        select: { name: true, division: true, isActive: true },
      });
      sites.forEach((site) => {
        console.log(`  - ${site.name} (${site.division}) [${site.isActive ? '거래중' : '거래중단'}]`);
      });
    }

    console.log('\n✅ Supabase connection verified!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
