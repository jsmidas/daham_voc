import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const userId = 'cd5c0b68-7b77-4f9a-b30a-2c224669484b';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        division: true,
        isActive: true,
        deletedAt: true,
      },
    });

    console.log('User details:');
    console.log(JSON.stringify(user, null, 2));

    if (!user) {
      console.log('\n❌ User does NOT exist in database!');
      console.log('\nSearching for all users:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        take: 10,
      });
      console.log(JSON.stringify(allUsers, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
