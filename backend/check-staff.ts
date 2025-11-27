import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 대표 계정 정보 조회
  const user = await prisma.user.findUnique({
    where: { phone: '01035421898' },
    include: {
      staff: {
        include: {
          staffSites: {
            include: { site: true }
          },
          staffSiteGroups: {
            include: { siteGroup: true }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('사용자를 찾을 수 없습니다: 01035421898');
    return;
  }

  // 선진 사업장 확인
  const sunjin = await prisma.site.findFirst({
    where: { name: { contains: '선진' } }
  });
  console.log('\n=== 선진 사업장 ===');
  console.log('ID:', sunjin?.id);
  console.log('이름:', sunjin?.name);

  // fc280d9f 사업장 확인
  const fcSite = await prisma.site.findUnique({
    where: { id: 'fc280d9f-91ab-4569-8955-f240ee2aeab2' }
  });
  console.log('\n=== fc280d9f 사업장 ===');
  console.log('ID:', fcSite?.id);
  console.log('이름:', fcSite?.name);

  // 선진 이름 포함 사업장 모두 조회
  const allSunjin = await prisma.site.findMany({
    where: { name: { contains: '선진' } }
  });
  console.log('\n=== 선진 포함 모든 사업장 ===');
  allSunjin.forEach((s: any) => console.log(s.id, s.name));

  console.log('=== 사용자 정보 ===');
  console.log('User ID:', user.id);
  console.log('이름:', user.name);
  console.log('전화번호:', user.phone);
  console.log('역할:', user.role);
  console.log('부문:', user.division);
  console.log('활성화:', user.isActive);
  console.log('삭제여부:', user.deletedAt);

  console.log('\n=== Staff 정보 ===');
  if (user.staff) {
    console.log('Staff ID:', user.staff.id);

    console.log('\n=== 개별 배정된 사업장 (StaffSite) ===');
    if (user.staff.staffSites.length === 0) {
      console.log('배정된 사업장 없음');
    } else {
      user.staff.staffSites.forEach((ss: any, i: number) => {
        console.log(i+1 + '.', ss.site?.name, '| siteId:', ss.siteId, '| removedAt:', ss.removedAt);
      });
    }

    console.log('\n=== 그룹 배정 (StaffSiteGroup) ===');
    if (user.staff.staffSiteGroups.length === 0) {
      console.log('배정된 그룹 없음');
    } else {
      user.staff.staffSiteGroups.forEach((sg: any, i: number) => {
        console.log(i+1 + '.', sg.siteGroup?.name, '| groupId:', sg.siteGroupId, '| removedAt:', sg.removedAt);
      });
    }
  } else {
    console.log('Staff 레코드 없음 - 이것이 문제의 원인일 수 있습니다!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
