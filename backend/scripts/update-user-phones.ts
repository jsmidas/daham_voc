import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserPhones() {
  try {
    // 전화번호가 없는 사용자 찾기
    const usersWithoutPhone = await prisma.user.findMany({
      where: {
        OR: [
          { phone: null },
          { phone: '' }
        ]
      }
    });

    console.log(`Found ${usersWithoutPhone.length} users without phone numbers`);

    // 각 사용자에게 임시 전화번호 부여 (이메일 기반)
    for (const user of usersWithoutPhone) {
      const tempPhone = user.email
        ? user.email.replace('@', '').replace(/[^0-9]/g, '').slice(0, 11)
        : `010${Math.random().toString().slice(2, 10)}`;

      console.log(`Updating user ${user.name} (${user.email}) with phone: ${tempPhone}`);

      await prisma.user.update({
        where: { id: user.id },
        data: { phone: tempPhone }
      });
    }

    console.log('All users updated successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserPhones();
