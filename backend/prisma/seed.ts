import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash('1234', 10);

  // 1. 관리자 계정 생성
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

  // 2. 사업장 그룹 생성
  const group1 = await prisma.siteGroup.create({
    data: {
      name: '서울권역',
      division: 'HQ',
    },
  });

  const group2 = await prisma.siteGroup.create({
    data: {
      name: '영남권역',
      division: 'YEONGNAM',
    },
  });
  console.log('✅ Site groups created');

  // 3. 사업장 생성
  const site1 = await prisma.site.create({
    data: {
      name: '서울 본사 사옥',
      type: 'CONSIGNMENT',
      division: 'HQ',
      groupId: group1.id,
      address: '서울시 강남구 테헤란로 14길 6',
      latitude: 37.4979,
      longitude: 127.0276,
      contactPerson1: '김담당',
      contactPhone1: '02-1234-5678',
      pricePerMeal: 8000,
      deliveryRoute: '본사 직배',
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      sortOrder: 1,
      isActive: true,
    },
  });

  const site2 = await prisma.site.create({
    data: {
      name: '부산 지사',
      type: 'DELIVERY',
      division: 'YEONGNAM',
      groupId: group2.id,
      address: '부산시 해운대구 센텀중앙로 78',
      latitude: 35.1688,
      longitude: 129.1313,
      contactPerson1: '이담당',
      contactPhone1: '051-1234-5678',
      pricePerMeal: 7500,
      deliveryRoute: '부산 배송',
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      sortOrder: 2,
      isActive: true,
    },
  });

  const site3 = await prisma.site.create({
    data: {
      name: '대구 공장',
      type: 'LUNCHBOX',
      division: 'YEONGNAM',
      groupId: group2.id,
      address: '대구시 달서구 성서공단로 11길 39',
      latitude: 35.8314,
      longitude: 128.5311,
      contactPerson1: '박담당',
      contactPhone1: '053-1234-5678',
      pricePerMeal: 7000,
      deliveryRoute: '대구 배송',
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2025-12-31'),
      sortOrder: 3,
      isActive: true,
    },
  });
  console.log('✅ Sites created:', site1.name, site2.name, site3.name);

  // 4. 직원 계정 생성
  const staff1 = await prisma.user.create({
    data: {
      email: 'staff1@daham.com',
      password: hashedPassword,
      name: '홍길동',
      phone: '01011111111',
      role: 'SITE_STAFF',
      division: 'HQ',
    },
  });

  const staffRecord1 = await prisma.staff.create({
    data: {
      userId: staff1.id,
      employeeNo: 'EMP001',
      department: '운영팀',
      position: '팀장',
    },
  });

  // 직원-사업장 연결
  await prisma.staffSite.create({
    data: {
      staffId: staffRecord1.id,
      siteId: site1.id,
      isPrimary: true,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@daham.com',
      password: hashedPassword,
      name: '김영희',
      phone: '01022222222',
      role: 'SITE_STAFF',
      division: 'YEONGNAM',
    },
  });

  const staffRecord2 = await prisma.staff.create({
    data: {
      userId: staff2.id,
      employeeNo: 'EMP002',
      department: '영업팀',
      position: '대리',
    },
  });

  await prisma.staffSite.create({
    data: {
      staffId: staffRecord2.id,
      siteId: site2.id,
      isPrimary: true,
    },
  });
  console.log('✅ Staff users created');

  // 5. 고객 계정 생성
  const client1 = await prisma.user.create({
    data: {
      email: 'client1@company.com',
      password: hashedPassword,
      name: '이고객',
      phone: '01033333333',
      role: 'CLIENT',
      division: 'HQ',
    },
  });
  console.log('✅ Client user created');

  // 6. 식단 메뉴 생성 (오늘과 내일)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.menu.createMany({
    data: [
      {
        siteId: site1.id,
        startDate: today,
        endDate: today,
        mealType: 'LUNCH',
        menuItems: '제육볶음, 김치찌개, 계란말이, 시금치나물, 배추김치',
      },
      {
        siteId: site1.id,
        startDate: tomorrow,
        endDate: tomorrow,
        mealType: 'LUNCH',
        menuItems: '불고기, 된장찌개, 계란후라이, 콩나물무침, 깍두기',
      },
      {
        siteId: site2.id,
        startDate: today,
        endDate: today,
        mealType: 'LUNCH',
        menuItems: '돈까스, 미역국, 감자샐러드, 단무지, 배추김치',
      },
    ],
  });
  console.log('✅ Menus created');

  // 7. 샘플 VOC 생성
  await prisma.customerFeedback.createMany({
    data: [
      {
        siteId: site1.id,
        authorId: client1.id,
        authorType: 'CLIENT',
        content: '음식이 맛있었습니다. 감사합니다!',
        rating: 5,
        status: 'RESOLVED',
        feedbackDate: today,
        mealType: 'LUNCH',
      },
      {
        siteId: site1.id,
        authorId: staff1.id,
        authorType: 'STAFF',
        content: '양이 좀 부족한 것 같습니다.',
        rating: 3,
        status: 'PENDING',
        feedbackDate: today,
        mealType: 'LUNCH',
      },
    ],
  });
  console.log('✅ Sample VOCs created');

  console.log('\n📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin: 01012345678 / 1234');
  console.log('Staff1: 01011111111 / 1234 (서울 본사)');
  console.log('Staff2: 01022222222 / 1234 (부산 지사)');
  console.log('Client1: 01033333333 / 1234 (서울 본사)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
