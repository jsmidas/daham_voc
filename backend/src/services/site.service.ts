import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { Division, SiteType } from '@prisma/client';
import { calculatePagination } from '../utils/pagination.util';

export interface SiteFilter {
  type?: SiteType;
  division?: Division;
  groupId?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CreateSiteDto {
  name: string;
  type: SiteType;
  division: Division;
  groupId?: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPerson1?: string;
  contactPhone1?: string;
  contactPerson2?: string;
  contactPhone2?: string;
  menuTypeIds?: string[];
  pricePerMeal?: number;
  deliveryRoute?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  staffIds?: string[];
}

export interface UpdateSiteDto {
  name?: string;
  type?: SiteType;
  division?: Division;
  groupId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPerson1?: string;
  contactPhone1?: string;
  contactPerson2?: string;
  contactPhone2?: string;
  menuTypeIds?: string[];
  pricePerMeal?: number;
  deliveryRoute?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  staffIds?: string[];
}

export class SiteService {
  /**
   * Get sites with filtering, pagination, and caching
   */
  async getSites(filter: SiteFilter, pagination: PaginationParams) {
    const cacheKey = `sites:${JSON.stringify({ filter, pagination })}`;

    // Check Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build filter conditions
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (filter.type) where.type = filter.type;
    if (filter.division) where.division = filter.division;
    if (filter.groupId) where.groupId = filter.groupId;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { address: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const { skip, take } = calculatePagination(pagination);

    // Fetch data
    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take,
        include: {
          group: true,
          staffSites: {
            include: {
              staff: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              menus: true,
              mealPhotos: true,
              feedbacks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.site.count({ where }),
    ]);

    const result = { sites, total };

    // Cache result for 10 minutes
    await cache.set(cacheKey, JSON.stringify(result), 600);

    return result;
  }

  /**
   * Get site by ID
   */
  async getSiteById(id: string, userId: string) {
    const site = await prisma.site.findUnique({
      where: { id, isActive: true },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        menus: {
          take: 10,
          orderBy: { startDate: 'desc' },
        },
        mealPhotos: {
          take: 10,
          orderBy: { capturedAt: 'desc' },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            menus: true,
            mealPhotos: true,
            feedbacks: true,
            attendances: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('사업장을 찾을 수 없습니다');
    }

    // Check view permission
    await this.checkViewPermission(site, userId);

    return site;
  }

  /**
   * Create site
   */
  async createSite(data: CreateSiteDto, userId: string) {
    // Check permission (division)
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'HQ_ADMIN' && data.division !== 'HQ') {
      throw new Error('본사 관리자는 본사 사업장만 생성할 수 있습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && data.division !== 'YEONGNAM') {
      throw new Error('영남지사 관리자는 영남지사 사업장만 생성할 수 있습니다');
    }

    // Create site
    const site = await prisma.site.create({
      data: {
        name: data.name,
        type: data.type,
        division: data.division,
        groupId: data.groupId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPerson1: data.contactPerson1,
        contactPhone1: data.contactPhone1,
        contactPerson2: data.contactPerson2,
        contactPhone2: data.contactPhone2,
        pricePerMeal: data.pricePerMeal,
        deliveryRoute: data.deliveryRoute,
        contractStartDate: data.contractStartDate,
        contractEndDate: data.contractEndDate,
        staffSites: data.staffIds
          ? {
              create: data.staffIds.map((staffId, index) => ({
                staffId,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        siteMenuTypes: data.menuTypeIds
          ? {
              create: data.menuTypeIds.map((menuTypeId) => ({
                menuTypeId,
              })),
            }
          : undefined,
      },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return site;
  }

  /**
   * Update site
   */
  async updateSite(id: string, data: UpdateSiteDto, userId: string) {
    // Check permission
    await this.checkPermission(id, userId);

    const site = await prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        division: data.division,
        groupId: data.groupId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        contactPerson1: data.contactPerson1,
        contactPhone1: data.contactPhone1,
        contactPerson2: data.contactPerson2,
        contactPhone2: data.contactPhone2,
        pricePerMeal: data.pricePerMeal,
        deliveryRoute: data.deliveryRoute,
        contractStartDate: data.contractStartDate,
        contractEndDate: data.contractEndDate,
        staffSites: data.staffIds
          ? {
              deleteMany: {},
              create: data.staffIds.map((staffId, index) => ({
                staffId,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        siteMenuTypes: data.menuTypeIds
          ? {
              deleteMany: {},
              create: data.menuTypeIds.map((menuTypeId) => ({
                menuTypeId,
              })),
            }
          : undefined,
      },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    await this.invalidateCache();
    return site;
  }

  /**
   * Delete site (soft delete)
   */
  async deleteSite(id: string, userId: string) {
    await this.checkPermission(id, userId);

    await prisma.site.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.invalidateCache();
  }

  /**
   * Check if user has permission to modify site
   */
  private async checkPermission(siteId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const site = await prisma.site.findUnique({ where: { id: siteId } });

    if (!site) {
      throw new Error('사업장을 찾을 수 없습니다');
    }

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'SUPER_ADMIN') return;

    if (user.role === 'HQ_ADMIN' && site.division !== 'HQ') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && site.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }
  }

  /**
   * Check if user has permission to view site
   */
  private async checkViewPermission(site: any, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { staff: true },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'SUPER_ADMIN') return;

    if (user.role === 'HQ_ADMIN' && site.division !== 'HQ') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && site.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'STAFF') {
      const isAssigned = site.staffSites.some(
        (ss: any) => ss.staff.userId === userId
      );
      if (!isAssigned) {
        throw new Error('담당 사업장이 아닙니다');
      }
    }
  }

  /**
   * Update site order (sortOrder)
   */
  async updateSiteOrder(siteId: string, newOrder: number, userId: string) {
    // Check permission
    await this.checkPermission(siteId, userId);

    await prisma.site.update({
      where: { id: siteId },
      data: { sortOrder: newOrder },
    });

    await this.invalidateCache();

    // Also invalidate site-groups cache
    const groupKeys = await cache.keys('site-groups:*');
    if (groupKeys.length > 0) {
      await cache.del(...groupKeys);
    }
  }

  /**
   * Batch update site orders
   */
  async batchUpdateSiteOrders(updates: { siteId: string; sortOrder: number }[], userId: string) {
    // Check permissions for all sites
    for (const update of updates) {
      await this.checkPermission(update.siteId, userId);
    }

    // Update all sites
    await prisma.$transaction(
      updates.map((update) =>
        prisma.site.update({
          where: { id: update.siteId },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    await this.invalidateCache();

    // Also invalidate site-groups cache
    const groupKeys = await cache.keys('site-groups:*');
    if (groupKeys.length > 0) {
      await cache.del(...groupKeys);
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache() {
    const keys = await cache.keys('sites:*');
    if (keys.length > 0) {
      await cache.del(...keys);
    }
  }
}
