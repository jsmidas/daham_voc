import { PrismaClient } from '@prisma/client';

// 로컬 DB 연결
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/daham_voc',
    },
  },
});

// Supabase DB 연결 (환경변수 사용)
const supabasePrisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from local to Supabase...\n');
    console.log('⚠️  This will DELETE all existing data in Supabase and replace it with local data!\n');

    // Delete existing data in reverse order (respecting foreign keys)
    console.log('🗑️  Deleting existing Supabase data...');
    await supabasePrisma.menu.deleteMany({});
    await supabasePrisma.siteMenuType.deleteMany({});
    await supabasePrisma.staffSite.deleteMany({});
    await supabasePrisma.staff.deleteMany({});
    await supabasePrisma.site.deleteMany({});
    await supabasePrisma.siteGroup.deleteMany({});
    await supabasePrisma.menuType.deleteMany({});
    await supabasePrisma.user.deleteMany({});
    console.log('✅ Existing data deleted\n');

    // 1. Users
    console.log('1️⃣ Migrating Users...');
    const users = await localPrisma.user.findMany();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      await supabasePrisma.user.create({
        data: user,
      });
    }
    console.log('✅ Users migrated\n');

    // 2. Menu Types
    console.log('2️⃣ Migrating Menu Types...');
    const menuTypes = await localPrisma.menuType.findMany();
    console.log(`Found ${menuTypes.length} menu types`);

    for (const menuType of menuTypes) {
      await supabasePrisma.menuType.create({
        data: menuType,
      });
    }
    console.log('✅ Menu Types migrated\n');

    // 3. Site Groups
    console.log('3️⃣ Migrating Site Groups...');
    const siteGroups = await localPrisma.siteGroup.findMany();
    console.log(`Found ${siteGroups.length} site groups`);

    for (const group of siteGroups) {
      await supabasePrisma.siteGroup.create({
        data: group,
      });
    }
    console.log('✅ Site Groups migrated\n');

    // 4. Sites
    console.log('4️⃣ Migrating Sites...');
    const sites = await localPrisma.site.findMany();
    console.log(`Found ${sites.length} sites`);

    for (const site of sites) {
      await supabasePrisma.site.create({
        data: site,
      });
    }
    console.log('✅ Sites migrated\n');

    // 5. Staff
    console.log('5️⃣ Migrating Staff...');
    const staff = await localPrisma.staff.findMany();
    console.log(`Found ${staff.length} staff`);

    for (const s of staff) {
      await supabasePrisma.staff.create({
        data: s,
      });
    }
    console.log('✅ Staff migrated\n');

    // 6. Staff Sites
    console.log('6️⃣ Migrating Staff Sites...');
    const staffSites = await localPrisma.staffSite.findMany();
    console.log(`Found ${staffSites.length} staff site relations`);

    for (const ss of staffSites) {
      await supabasePrisma.staffSite.create({
        data: ss,
      });
    }
    console.log('✅ Staff Sites migrated\n');

    // 7. Site Menu Types
    console.log('7️⃣ Migrating Site Menu Types...');
    const siteMenuTypes = await localPrisma.siteMenuType.findMany();
    console.log(`Found ${siteMenuTypes.length} site menu type relations`);

    for (const smt of siteMenuTypes) {
      await supabasePrisma.siteMenuType.create({
        data: smt,
      });
    }
    console.log('✅ Site Menu Types migrated\n');

    // 8. Menus
    console.log('8️⃣ Migrating Menus...');
    const menus = await localPrisma.menu.findMany();
    console.log(`Found ${menus.length} menus`);

    for (const menu of menus) {
      await supabasePrisma.menu.create({
        data: menu,
      });
    }
    console.log('✅ Menus migrated\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Menu Types: ${menuTypes.length}`);
    console.log(`- Site Groups: ${siteGroups.length}`);
    console.log(`- Sites: ${sites.length}`);
    console.log(`- Staff: ${staff.length}`);
    console.log(`- Menus: ${menus.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
  }
}

migrateData();
