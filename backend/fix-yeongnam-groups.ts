import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixGroups() {
  console.log('=== 영남지사 사업장 그룹 수정 시작 ===\n');

  // 1. 그룹 ID 매핑
  const hqGroups = {
    dosirak: 'cb9b5a4a-9ff8-497d-bea9-947fbaf137de',
    yoyangwon: 'dcdde3da-c4b0-4f79-8c1d-8c598ee77c2e',
    unban: '81ff29f3-d1ce-48f6-8460-af8e7d32ce5e',
  };

  const yeongnamGroups = {
    dosirak: '37c94798-1af7-445b-b8a7-e6cb5a57b634',
    yoyangwon: '0b6dafe0-fe36-4330-81bf-674001f4671c',
    unban: 'd1675156-3b93-4419-865c-fa963259b9a0',
  };

  // 2. 영남지사 사업장 중 HQ 그룹을 사용하는 것들 찾기
  const sitesToFix = await prisma.site.findMany({
    where: {
      division: 'YEONGNAM',
      groupId: {
        in: Object.values(hqGroups)
      }
    },
    include: {
      group: true
    }
  });

  console.log(`수정 대상: ${sitesToFix.length}개 사업장\n`);

  let fixed = 0;
  let errors = 0;

  for (const site of sitesToFix) {
    try {
      let newGroupId: string | null = null;

      // 현재 그룹에 따라 새 그룹 결정
      if (site.groupId === hqGroups.dosirak) {
        newGroupId = yeongnamGroups.dosirak;
      } else if (site.groupId === hqGroups.unban) {
        newGroupId = yeongnamGroups.unban;
      } else if (site.groupId === hqGroups.yoyangwon) {
        newGroupId = yeongnamGroups.yoyangwon;
      }

      if (newGroupId) {
        await prisma.site.update({
          where: { id: site.id },
          data: { groupId: newGroupId }
        });

        console.log(`✅ ${site.name}: ${site.group?.name} → 영남${site.group?.name}`);
        fixed++;
      }
    } catch (error: any) {
      console.error(`❌ ${site.name}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n=== 수정 완료 ===`);
  console.log(`성공: ${fixed}개`);
  console.log(`실패: ${errors}개`);

  // 3. 결과 확인
  console.log('\n=== 수정 후 영남지사 그룹별 개수 ===');
  const groupCounts = await prisma.site.groupBy({
    by: ['groupId'],
    where: { division: 'YEONGNAM' },
    _count: true
  });

  for (const item of groupCounts) {
    const group = await prisma.siteGroup.findUnique({
      where: { id: item.groupId || '' }
    });
    console.log(`${group?.name || '그룹 없음'}: ${item._count}개`);
  }

  await prisma.$disconnect();
}

fixGroups();
