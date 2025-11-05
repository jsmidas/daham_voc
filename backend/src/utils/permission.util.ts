/**
 * Permission Utility
 * @description 사업장 접근 권한 체크 유틸리티
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 사용자가 특정 사업장에 접근 가능한지 확인
 * @param userId - 사용자 ID
 * @param siteId - 사업장 ID
 * @returns 접근 가능 여부
 */
export async function canAccessSite(userId: string, siteId: string): Promise<boolean> {
  // 1. 사용자 및 Staff 정보 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staff: {
        include: {
          // 개별 사업장 배정
          staffSites: {
            where: {
              siteId,
              removedAt: null,
            },
          },
          // 그룹 배정
          staffSiteGroups: {
            where: {
              removedAt: null,
            },
            include: {
              siteGroup: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return false;
  }

  // 2. SUPER_ADMIN은 모든 사업장 접근 가능
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // 3. Staff가 아니면 접근 불가
  if (!user.staff) {
    return false;
  }

  // 4. 개별 사업장 배정 확인
  if (user.staff.staffSites && user.staff.staffSites.length > 0) {
    return true;
  }

  // 5. 그룹 배정 확인 - 해당 사업장이 배정된 그룹에 속하는지 확인
  if (user.staff.staffSiteGroups && user.staff.staffSiteGroups.length > 0) {
    // 사업장 정보 조회
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { groupId: true },
    });

    if (site && site.groupId) {
      // 배정된 그룹 중에 사업장의 그룹이 있는지 확인
      const hasGroupAccess = user.staff.staffSiteGroups.some(
        (staffSiteGroup) => staffSiteGroup.siteGroupId === site.groupId
      );

      if (hasGroupAccess) {
        return true;
      }
    }
  }

  // 6. 접근 불가
  return false;
}

/**
 * 사용자가 접근 가능한 모든 사업장 ID 목록 조회
 * @param userId - 사용자 ID
 * @returns 접근 가능한 사업장 ID 배열
 */
export async function getAccessibleSiteIds(userId: string): Promise<string[]> {
  // 1. 사용자 및 Staff 정보 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staff: {
        include: {
          staffSites: {
            where: { removedAt: null },
            select: { siteId: true },
          },
          staffSiteGroups: {
            where: { removedAt: null },
            include: {
              siteGroup: {
                include: {
                  sites: {
                    where: {
                      deletedAt: null,
                      isActive: true,
                    },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  // 2. SUPER_ADMIN은 모든 활성 사업장 접근 가능
  if (user.role === 'SUPER_ADMIN') {
    const allSites = await prisma.site.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });
    return allSites.map((site) => site.id);
  }

  // 3. Staff가 아니면 접근 불가
  if (!user.staff) {
    return [];
  }

  const siteIds = new Set<string>();

  // 4. 개별 사업장 배정에서 ID 수집
  if (user.staff.staffSites) {
    user.staff.staffSites.forEach((staffSite) => {
      siteIds.add(staffSite.siteId);
    });
  }

  // 5. 그룹 배정에서 사업장 ID 수집
  if (user.staff.staffSiteGroups) {
    user.staff.staffSiteGroups.forEach((staffSiteGroup) => {
      if (staffSiteGroup.siteGroup && staffSiteGroup.siteGroup.sites) {
        staffSiteGroup.siteGroup.sites.forEach((site) => {
          siteIds.add(site.id);
        });
      }
    });
  }

  return Array.from(siteIds);
}

/**
 * 사용자의 division에 따른 사업장 필터
 * @param userId - 사용자 ID
 * @returns Division 기반 필터 조건
 */
export async function getDivisionFilter(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, division: true },
  });

  if (!user) {
    return { division: null };
  }

  // SUPER_ADMIN은 모든 division 접근 가능
  if (user.role === 'SUPER_ADMIN') {
    return {};
  }

  // HQ_ADMIN은 본사만
  if (user.role === 'HQ_ADMIN') {
    return { division: 'HQ' };
  }

  // YEONGNAM_ADMIN은 영남지사만
  if (user.role === 'YEONGNAM_ADMIN') {
    return { division: 'YEONGNAM' };
  }

  // 나머지는 자신의 division만
  if (user.division) {
    return { division: user.division };
  }

  return {};
}
