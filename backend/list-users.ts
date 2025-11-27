import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      isActive: true
    }
  });

  console.log('=== 사용자 목록 ===');
  console.log('phone | name | role | active');
  console.log('----------------------------');
  users.forEach(u => {
    console.log(`${u.phone} | ${u.name} | ${u.role} | ${u.isActive}`);
  });
}

main().finally(() => prisma.$disconnect());
