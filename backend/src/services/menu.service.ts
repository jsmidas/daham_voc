/**
 * Menu Service
 * @description 식단 CRUD 및 비즈니스 로직
 */

import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { MealType } from '@prisma/client';
import { uploadImage, deleteImage, extractPathFromUrl } from './storage.service';

export interface CreateMenuDto {
  siteId: string;
  startDate: Date;
  endDate: Date;
  mealType: MealType;
  menuItems?: string;
  image?: Express.Multer.File;
}

export interface UpdateMenuDto {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
  menuItems?: string;
  image?: Express.Multer.File;
  deleteImage?: boolean;
}

export interface MenuFilter {
  siteId?: string;
  siteIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: MealType;
}

/**
 * 식단 생성
 */
export async function createMenu(
  dto: CreateMenuDto,
  _userId: string
): Promise<any> {
  // 중복 체크
  const existing = await prisma.menu.findFirst({
    where: {
      siteId: dto.siteId,
      startDate: dto.startDate,
      mealType: dto.mealType,
      deletedAt: null,
    },
  });

  if (existing) {
    throw new Error('Menu already exists for this date and meal type');
  }

  // 이미지 업로드
  let imageUrl: string | undefined;
  let thumbnailUrl: string | undefined;

  if (dto.image) {
    const uploaded = await uploadImage(dto.image, 'menus');
    imageUrl = uploaded.originalUrl;
    thumbnailUrl = uploaded.thumbnailUrl;
  }

  // DB 저장
  const menu = await prisma.menu.create({
    data: {
      siteId: dto.siteId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      mealType: dto.mealType,
      menuItems: dto.menuItems,
      imageUrl,
      thumbnailUrl,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMenuCache(dto.siteId);

  return menu;
}

/**
 * 사업장 그룹 일괄 식단 생성
 */
export async function createMenuForGroup(
  groupId: string,
  startDate: Date,
  endDate: Date,
  mealType: MealType,
  menuItems: string | undefined,
  image: Express.Multer.File | undefined,
  _userId: string
): Promise<{
  created: any[];
  failed: Array<{ siteId: string; siteName: string; error: string }>;
}> {
  // 그룹 내 사업장 조회
  const group = await prisma.siteGroup.findUnique({
    where: { id: groupId },
    include: {
      sites: {
        where: { isActive: true, deletedAt: null },
      },
    },
  });

  if (!group) {
    throw new Error('Site group not found');
  }

  // 이미지 업로드 (모든 사업장에 동일하게 사용)
  let imageUrl: string | undefined;
  let thumbnailUrl: string | undefined;

  if (image) {
    const uploaded = await uploadImage(image, 'menus');
    imageUrl = uploaded.originalUrl;
    thumbnailUrl = uploaded.thumbnailUrl;
  }

  // 각 사업장별 생성
  const created: any[] = [];
  const failed: Array<{ siteId: string; siteName: string; error: string }> = [];

  for (const site of group.sites) {
    try {
      // 중복 체크
      const existing = await prisma.menu.findFirst({
        where: {
          siteId: site.id,
          startDate,
          mealType,
          deletedAt: null,
        },
      });

      if (existing) {
        failed.push({
          siteId: site.id,
          siteName: site.name,
          error: 'Menu already exists',
        });
        continue;
      }

      // 생성
      const menu = await prisma.menu.create({
        data: {
          siteId: site.id,
          startDate,
          endDate,
          mealType,
          menuItems,
          imageUrl,
          thumbnailUrl,
        },
        include: { site: true },
      });

      created.push(menu);

      // 캐시 무효화
      await invalidateMenuCache(site.id);
    } catch (error: any) {
      failed.push({
        siteId: site.id,
        siteName: site.name,
        error: error.message,
      });
    }
  }

  return { created, failed };
}

/**
 * 식단 목록 조회
 */
export async function getMenus(filter: MenuFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `menus:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 필터 조건 구성
  const where: any = {
    deletedAt: null,
  };

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.siteIds && filter.siteIds.length > 0) {
    where.siteId = { in: filter.siteIds };
  }

  if (filter.dateFrom || filter.dateTo) {
    where.startDate = {};
    if (filter.dateFrom) where.startDate.gte = filter.dateFrom;
    if (filter.dateTo) where.startDate.lte = filter.dateTo;
  }

  if (filter.mealType) {
    where.mealType = filter.mealType;
  }

  // 조회
  const menus = await prisma.menu.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
    },
    orderBy: [{ startDate: 'desc' }, { mealType: 'asc' }],
  });

  // 캐시 저장 (10분)
  await cache.set(cacheKey, JSON.stringify(menus), 600);

  return menus;
}

/**
 * 식단 상세 조회
 */
export async function getMenuById(id: string): Promise<any> {
  const menu = await prisma.menu.findUnique({
    where: { id },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  if (!menu || menu.deletedAt) {
    throw new Error('Menu not found');
  }

  return menu;
}

/**
 * 식단 수정
 */
export async function updateMenu(
  menuId: string,
  dto: UpdateMenuDto,
  _userId: string
): Promise<any> {
  // 기존 메뉴 조회
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu || menu.deletedAt) {
    throw new Error('Menu not found');
  }

  // 업데이트 데이터 준비
  const updateData: any = {};

  if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
  if (dto.endDate !== undefined) updateData.endDate = dto.endDate;
  if (dto.mealType !== undefined) updateData.mealType = dto.mealType;
  if (dto.menuItems !== undefined) updateData.menuItems = dto.menuItems;

  // 기존 이미지 삭제 요청 시
  if (dto.deleteImage && menu.imageUrl) {
    const path = extractPathFromUrl(menu.imageUrl);
    const thumbPath = extractPathFromUrl(menu.thumbnailUrl!);
    await deleteImage(path, thumbPath);

    updateData.imageUrl = null;
    updateData.thumbnailUrl = null;
  }

  // 새 이미지 업로드
  if (dto.image) {
    // 기존 이미지가 있으면 삭제
    if (menu.imageUrl) {
      const path = extractPathFromUrl(menu.imageUrl);
      const thumbPath = extractPathFromUrl(menu.thumbnailUrl!);
      await deleteImage(path, thumbPath);
    }

    const uploaded = await uploadImage(dto.image, 'menus');
    updateData.imageUrl = uploaded.originalUrl;
    updateData.thumbnailUrl = uploaded.thumbnailUrl;
  }

  // DB 업데이트
  const updated = await prisma.menu.update({
    where: { id: menuId },
    data: updateData,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateMenuCache(menu.siteId);

  return updated;
}

/**
 * 식단 삭제 (Soft Delete)
 */
export async function deleteMenu(menuId: string, _userId: string): Promise<void> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu || menu.deletedAt) {
    throw new Error('Menu not found');
  }

  // 이미지 삭제
  if (menu.imageUrl) {
    const path = extractPathFromUrl(menu.imageUrl);
    const thumbPath = extractPathFromUrl(menu.thumbnailUrl!);
    await deleteImage(path, thumbPath);
  }

  // Soft Delete
  await prisma.menu.update({
    where: { id: menuId },
    data: { deletedAt: new Date() },
  });

  // 캐시 무효화
  await invalidateMenuCache(menu.siteId);
}

/**
 * 캐시 무효화
 */
async function invalidateMenuCache(siteId: string): Promise<void> {
  const keys = await cache.keys(`menus:*${siteId}*`);
  if (keys.length > 0) {
    await cache.del(...keys);
  }
}

/**
 * 주간 식단 조회
 */
export async function getWeeklyMenus(
  siteId: string,
  weekStart: Date
): Promise<any[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return getMenus({
    siteId,
    dateFrom: weekStart,
    dateTo: weekEnd,
  });
}

/**
 * 월간 식단 조회
 */
export async function getMonthlyMenus(
  siteId: string,
  year: number,
  month: number
): Promise<any[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  return getMenus({
    siteId,
    dateFrom: monthStart,
    dateTo: monthEnd,
  });
}
