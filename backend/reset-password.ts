import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('1234', 10);

  const user = await prisma.user.update({
    where: { phone: '01034567890' },
    data: { password: hashedPassword }
  });

  console.log('비밀번호 초기화 완료!');
  console.log('전화번호:', user.phone);
  console.log('이름:', user.name);
  console.log('새 비밀번호: 1234');
}

main().finally(() => prisma.$disconnect());
