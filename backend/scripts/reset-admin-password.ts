import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // 1234를 bcrypt hash로 변환
    const hashedPassword = await bcrypt.hash('1234', 10);

    // 관리자 계정 업데이트
    const result = await prisma.user.updateMany({
      where: {
        email: 'admin@daham.com'
      },
      data: {
        password: hashedPassword
      }
    });

    console.log(`✅ Updated ${result.count} user(s)`);
    console.log('📱 Phone: 01012345678');
    console.log('🔑 Password: 1234');
    console.log('\n로그인 정보:');
    console.log('- 전화번호: 01012345678');
    console.log('- 비밀번호: 1234');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
