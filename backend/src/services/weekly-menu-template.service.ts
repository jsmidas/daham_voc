import { prisma } from '../config/database';
import { cache } from '../config/redis';

export interface CreateWeeklyMenuTemplateDto {
  menuTypeId: string;
  year: number;
  weekNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface UpdateWeeklyMenuTemplateDto {
  imageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
}

export class WeeklyMenuTemplateService {
  /**
   * Get all weekly menu templates with optional filters
   */
  async getWeeklyMenuTemplates(filters?: {
    menuTypeId?: string;
    year?: number;
    weekNumber?: number;
  }) {
    const cacheKey = `weekly-menu-templates:${JSON.stringify(filters || {})}`;

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { deletedAt: null };
    if (filters?.menuTypeId) where.menuTypeId = filters.menuTypeId;
    if (filters?.year) where.year = filters.year;
    if (filters?.weekNumber) where.weekNumber = filters.weekNumber;

    const templates = await prisma.weeklyMenuTemplate.findMany({
      where,
      include: {
        menuType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(templates), 600);

    return templates;
  }

  /**
   * Get weekly menu template by ID
   */
  async getWeeklyMenuTemplateById(id: string) {
    const template = await prisma.weeklyMenuTemplate.findUnique({
      where: { id, deletedAt: null },
      include: {
        menuType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('주간 식단표를 찾을 수 없습니다');
    }

    return template;
  }

  /**
   * Get weekly menu template by menuTypeId, year, and weekNumber
   */
  async getWeeklyMenuTemplateByYearWeek(
    menuTypeId: string,
    year: number,
    weekNumber: number
  ) {
    const template = await prisma.weeklyMenuTemplate.findUnique({
      where: {
        menuTypeId_year_weekNumber: {
          menuTypeId,
          year,
          weekNumber,
        },
        deletedAt: null,
      },
      include: {
        menuType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
      },
    });

    return template; // null if not found
  }

  /**
   * Create weekly menu template
   */
  async createWeeklyMenuTemplate(
    data: CreateWeeklyMenuTemplateDto,
    userId: string
  ) {
    // Check permission
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'HQ_ADMIN' &&
      user.role !== 'YEONGNAM_ADMIN'
    ) {
      throw new Error('권한이 없습니다');
    }

    // Check if menu type exists
    const menuType = await prisma.menuType.findUnique({
      where: { id: data.menuTypeId, isActive: true },
    });

    if (!menuType) {
      throw new Error('식단 유형을 찾을 수 없습니다');
    }

    // Check duplicate
    const existing = await prisma.weeklyMenuTemplate.findUnique({
      where: {
        menuTypeId_year_weekNumber: {
          menuTypeId: data.menuTypeId,
          year: data.year,
          weekNumber: data.weekNumber,
        },
      },
    });

    if (existing && !existing.deletedAt) {
      throw new Error('이미 해당 주차의 식단표가 존재합니다');
    }

    let template;

    if (existing && existing.deletedAt) {
      // Soft delete된 레코드가 존재하면 복원 및 업데이트
      template = await prisma.weeklyMenuTemplate.update({
        where: { id: existing.id },
        data: {
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          description: data.description,
          createdBy: userId,
          deletedAt: null, // 복원
          updatedAt: new Date(),
        },
        include: {
          menuType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
            },
          },
        },
      });
    } else {
      // 새로운 레코드 생성
      template = await prisma.weeklyMenuTemplate.create({
        data: {
          menuTypeId: data.menuTypeId,
          year: data.year,
          weekNumber: data.weekNumber,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          description: data.description,
          createdBy: userId,
        },
        include: {
          menuType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
            },
          },
        },
      });
    }

    await this.invalidateCache();

    return template;
  }

  /**
   * Update weekly menu template
   */
  async updateWeeklyMenuTemplate(
    id: string,
    data: UpdateWeeklyMenuTemplateDto,
    userId: string
  ) {
    // Check permission
    await this.checkPermission(userId);

    const template = await prisma.weeklyMenuTemplate.update({
      where: { id },
      data: {
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        description: data.description,
      },
      include: {
        menuType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
      },
    });

    await this.invalidateCache();

    return template;
  }

  /**
   * Delete weekly menu template (soft delete)
   */
  async deleteWeeklyMenuTemplate(id: string, userId: string) {
    await this.checkPermission(userId);

    await prisma.weeklyMenuTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.invalidateCache();
  }

  /**
   * Get weekly menu templates for a specific site (based on site's menu types)
   */
  async getWeeklyMenuTemplatesForSite(
    siteId: string,
    year?: number,
    weekNumber?: number
  ) {
    // Get site's menu types
    const siteMenuTypes = await prisma.siteMenuType.findMany({
      where: { siteId },
      select: { menuTypeId: true },
    });

    const menuTypeIds = siteMenuTypes.map((smt) => smt.menuTypeId);

    if (menuTypeIds.length === 0) {
      return [];
    }

    const where: any = {
      menuTypeId: { in: menuTypeIds },
      deletedAt: null,
    };

    if (year) where.year = year;
    if (weekNumber) where.weekNumber = weekNumber;

    const templates = await prisma.weeklyMenuTemplate.findMany({
      where,
      include: {
        menuType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    return templates;
  }

  /**
   * Check if user has permission
   */
  private async checkPermission(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'HQ_ADMIN' &&
      user.role !== 'YEONGNAM_ADMIN'
    ) {
      throw new Error('권한이 없습니다');
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache() {
    const keys = await cache.keys('weekly-menu-templates:*');
    if (keys.length > 0) {
      await cache.del(...keys);
    }
  }
}
