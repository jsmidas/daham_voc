import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('1234', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '01012345678' },
    update: {},
    create: {
      email: 'admin@daham.com',
      password: hashedPassword,
      name: '관리자',
      phone: '01012345678',
      role: 'SUPER_ADMIN',
      division: 'HQ',
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('📱 Phone: 01012345678');
  console.log('🔑 Password: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
