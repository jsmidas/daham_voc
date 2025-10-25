import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function checkDatabaseCounts() {
  try {
    const counts = {
      users: await prisma.user.count(),
      staff: await prisma.staff.count(),
      sites: await prisma.site.count(),
      siteGroups: await prisma.siteGroup.count(),
      menuTypes: await prisma.menuType.count(),
      menus: await prisma.menu.count(),
      deliveryRoutes: await prisma.deliveryRoute.count(),
      deliveryRouteStops: await prisma.deliveryRouteStop.count(),
      deliveryAssignments: await prisma.deliveryAssignment.count(),
      deliveryLogs: await prisma.deliveryLog.count(),
      attendances: await prisma.attendance.count(),
      mealCounts: await prisma.mealCount.count(),
      mealPhotos: await prisma.mealPhoto.count(),
      feedbacks: await prisma.customerFeedback.count(),
    };

    console.log('\n========================================');
    console.log('📊 Database Record Counts (Supabase)');
    console.log('========================================\n');

    Object.entries(counts).forEach(([table, count]) => {
      const displayName = table.padEnd(25, ' ');
      console.log(`${displayName}: ${count}`);
    });

    console.log('\n========================================');
    console.log(`Total Records: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error checking database counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseCounts();
