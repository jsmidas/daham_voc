import { prisma } from '../config/database';
import { cache } from '../config/redis';

export interface CreateMenuTypeDto {
  name: string;
  division?: 'HQ' | 'YEONGNAM';
  description?: string;
  price?: number;
  sortOrder?: number;
}

export interface UpdateMenuTypeDto {
  name?: string;
  division?: 'HQ' | 'YEONGNAM';
  description?: string;
  price?: number;
  sortOrder?: number;
}

export class MenuTypeService {
  /**
   * Get all menu types
   */
  async getMenuTypes() {
    const cacheKey = 'menu-types:all';

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const menuTypes = await prisma.menuType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        weeklyMenuTemplates: {
          where: { deletedAt: null },
          orderBy: [
            { year: 'desc' },
            { weekNumber: 'desc' },
          ],
        },
        _count: {
          select: {
            siteMenuTypes: true,
            weeklyMenuTemplates: true,
          },
        },
      },
    });

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(menuTypes), 600);

    return menuTypes;
  }

  /**
   * Get menu type by ID
   */
  async getMenuTypeById(id: string) {
    const menuType = await prisma.menuType.findUnique({
      where: { id, isActive: true },
      include: {
        siteMenuTypes: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                type: true,
                division: true,
              },
            },
          },
        },
        _count: {
          select: { siteMenuTypes: true },
        },
      },
    });

    if (!menuType) {
      throw new Error('식단 유형을 찾을 수 없습니다');
    }

    return menuType;
  }

  /**
   * Create menu type
   */
  async createMenuType(data: CreateMenuTypeDto, userId: string) {
    // Check permission
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HQ_ADMIN') {
      throw new Error('권한이 없습니다');
    }

    // Check duplicate name
    const existing = await prisma.menuType.findFirst({
      where: { name: data.name, isActive: true },
    });

    if (existing) {
      throw new Error('이미 존재하는 식단 유형입니다');
    }

    const menuType = await prisma.menuType.create({
      data: {
        name: data.name,
        division: data.division ?? 'HQ',
        description: data.description,
        price: data.price,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await this.invalidateCache();

    return menuType;
  }

  /**
   * Update menu type
   */
  async updateMenuType(id: string, data: UpdateMenuTypeDto, userId: string) {
    // Check permission
    await this.checkPermission(userId);

    // Check duplicate name if name is being changed
    if (data.name) {
      const existing = await prisma.menuType.findFirst({
        where: {
          name: data.name,
          isActive: true,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('이미 존재하는 식단 유형입니다');
      }
    }

    const menuType = await prisma.menuType.update({
      where: { id },
      data: {
        name: data.name,
        division: data.division,
        description: data.description,
        price: data.price,
        sortOrder: data.sortOrder,
      },
    });

    await this.invalidateCache();

    return menuType;
  }

  /**
   * Delete menu type (soft delete)
   */
  async deleteMenuType(id: string, userId: string) {
    await this.checkPermission(userId);

    // Check if menu type is in use
    const count = await prisma.siteMenuType.count({
      where: { menuTypeId: id },
    });

    if (count > 0) {
      throw new Error('사업장에서 사용 중인 식단 유형은 삭제할 수 없습니다');
    }

    await prisma.menuType.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.invalidateCache();
  }

  /**
   * Check if user has permission
   */
  private async checkPermission(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'HQ_ADMIN') {
      throw new Error('권한이 없습니다');
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache() {
    const keys = await cache.keys('menu-types:*');
    if (keys.length > 0) {
      await cache.del(...keys);
    }
  }
}
