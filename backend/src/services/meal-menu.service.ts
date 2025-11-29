/**
 * Meal Menu Service
 * @description 식수 메뉴 관리 서비스
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 전체 메뉴 목록 조회
 */
export async function getMealMenus(includeInactive = false) {
  return await prisma.mealMenu.findMany({
    where: includeInactive ? {} : { isActive: true, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * 메뉴 단일 조회
 */
export async function getMealMenuById(id: string) {
  return await prisma.mealMenu.findUnique({
    where: { id },
    include: {
      siteMealMenus: {
        include: {
          site: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

/**
 * 메뉴 생성
 */
export async function createMealMenu(data: {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return await prisma.mealMenu.create({
    data: {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * 메뉴 수정
 */
export async function updateMealMenu(
  id: string,
  data: {
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  return await prisma.mealMenu.update({
    where: { id },
    data,
  });
}

/**
 * 메뉴 삭제 (소프트 삭제)
 */
export async function deleteMealMenu(id: string) {
  return await prisma.mealMenu.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

/**
 * 사업장에 할당된 메뉴 목록 조회
 */
export async function getSiteMealMenus(siteId: string) {
  const siteMealMenus = await prisma.siteMealMenu.findMany({
    where: { siteId },
    include: {
      mealMenu: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return siteMealMenus.map((smm) => ({
    id: smm.mealMenu.id,
    name: smm.mealMenu.name,
    description: smm.mealMenu.description,
    sortOrder: smm.sortOrder,
  }));
}

/**
 * 사업장에 메뉴 할당 (복수)
 */
export async function assignMealMenusToSite(siteId: string, mealMenuIds: string[]) {
  // 기존 할당 삭제
  await prisma.siteMealMenu.deleteMany({
    where: { siteId },
  });

  // 새로운 할당 생성
  if (mealMenuIds.length > 0) {
    const createData = mealMenuIds.map((mealMenuId, index) => ({
      siteId,
      mealMenuId,
      sortOrder: index,
    }));

    await prisma.siteMealMenu.createMany({
      data: createData,
    });
  }

  return await getSiteMealMenus(siteId);
}

/**
 * 메뉴가 사용된 사업장 목록 조회
 */
export async function getSitesByMealMenu(mealMenuId: string) {
  const siteMealMenus = await prisma.siteMealMenu.findMany({
    where: { mealMenuId },
    include: {
      site: {
        select: { id: true, name: true, division: true },
      },
    },
  });

  return siteMealMenus.map((smm) => smm.site);
}
