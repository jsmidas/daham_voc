import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { Division, MarkerShape } from '@prisma/client';

export interface CreateSiteGroupDto {
  name: string;
  division: Division;
  description?: string;
  markerShape?: MarkerShape;
  markerColor?: string;
  sortOrder?: number;
}

export interface UpdateSiteGroupDto {
  name?: string;
  division?: Division;
  description?: string;
  markerShape?: MarkerShape;
  markerColor?: string;
  sortOrder?: number;
}

export class SiteGroupService {
  /**
   * Get hierarchy structure for site management
   * 다함푸드 > 본사/영남 > 그룹(도시락/운반/행사) > 사업장
   */
  async getHierarchy() {
    const cacheKey = 'site-groups:hierarchy';

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all groups with sites
    const groups = await prisma.siteGroup.findMany({
      where: { isActive: true },
      include: {
        sites: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            latitude: true,
            longitude: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Get consignment sites (no group)
    const consignmentSites = await prisma.site.findMany({
      where: {
        type: 'CONSIGNMENT',
        groupId: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        division: true,
        address: true,
        latitude: true,
        longitude: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Build hierarchy
    const hierarchy = {
      company: '다함푸드',
      divisions: [
        {
          code: 'HQ',
          name: '본사',
          groups: groups
            .filter((g) => g.division === 'HQ')
            .map((g) => ({
              id: g.id,
              name: g.name,
              markerShape: g.markerShape,
              markerColor: g.markerColor,
              description: g.description,
              sortOrder: g.sortOrder,
              sites: g.sites,
            })),
        },
        {
          code: 'YEONGNAM',
          name: '영남지사',
          groups: groups
            .filter((g) => g.division === 'YEONGNAM')
            .map((g) => ({
              id: g.id,
              name: g.name,
              markerShape: g.markerShape,
              markerColor: g.markerColor,
              description: g.description,
              sortOrder: g.sortOrder,
              sites: g.sites,
            })),
        },
        {
          code: 'CONSIGNMENT',
          name: '위탁사업장',
          sites: consignmentSites,
        },
      ],
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(hierarchy), 600);

    return hierarchy;
  }

  /**
   * Get all site groups with optional division filter
   */
  async getGroups(division?: Division) {
    const cacheKey = `site-groups:${division || 'all'}`;

    // Check cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = { isActive: true };
    if (division) where.division = division;

    const groups = await prisma.siteGroup.findMany({
      where,
      include: {
        sites: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
        _count: {
          select: { sites: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(groups), 600);

    return groups;
  }

  /**
   * Get site group by ID
   */
  async getGroupById(id: string) {
    const group = await prisma.siteGroup.findUnique({
      where: { id, isActive: true },
      include: {
        sites: {
          where: { isActive: true },
          include: {
            staffSites: {
              include: {
                staff: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { sites: true },
        },
      },
    });

    if (!group) {
      throw new Error('사업장 그룹을 찾을 수 없습니다');
    }

    return group;
  }

  /**
   * Create site group
   */
  async createGroup(data: CreateSiteGroupDto, userId: string) {
    // Check permission
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'HQ_ADMIN' && data.division !== 'HQ') {
      throw new Error('본사 관리자는 본사 그룹만 생성할 수 있습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && data.division !== 'YEONGNAM') {
      throw new Error('영남지사 관리자는 영남지사 그룹만 생성할 수 있습니다');
    }

    const group = await prisma.siteGroup.create({
      data,
      include: {
        sites: true,
        _count: {
          select: { sites: true },
        },
      },
    });

    await this.invalidateCache();

    return group;
  }

  /**
   * Update site group
   */
  async updateGroup(id: string, data: UpdateSiteGroupDto, userId: string) {
    // Check permission
    await this.checkPermission(id, userId);

    const group = await prisma.siteGroup.update({
      where: { id },
      data,
      include: {
        sites: true,
        _count: {
          select: { sites: true },
        },
      },
    });

    await this.invalidateCache();

    return group;
  }

  /**
   * Delete site group (soft delete)
   */
  async deleteGroup(id: string, userId: string) {
    await this.checkPermission(id, userId);

    // Check if group has sites
    const group = await prisma.siteGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sites: true },
        },
      },
    });

    if (group && group._count.sites > 0) {
      throw new Error('사업장이 있는 그룹은 삭제할 수 없습니다');
    }

    await prisma.siteGroup.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.invalidateCache();
  }

  /**
   * Add sites to group
   */
  async addSitesToGroup(groupId: string, siteIds: string[], userId: string) {
    await this.checkPermission(groupId, userId);

    const group = await prisma.siteGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('그룹을 찾을 수 없습니다');
    }

    // Check if sites belong to same division
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
    });

    const invalidSites = sites.filter((s) => s.division !== group.division);
    if (invalidSites.length > 0) {
      throw new Error('같은 부문의 사업장만 추가할 수 있습니다');
    }

    await prisma.site.updateMany({
      where: { id: { in: siteIds } },
      data: { groupId },
    });

    await this.invalidateCache();
  }

  /**
   * Remove sites from group
   */
  async removeSitesFromGroup(groupId: string, siteIds: string[], userId: string) {
    await this.checkPermission(groupId, userId);

    await prisma.site.updateMany({
      where: {
        id: { in: siteIds },
        groupId,
      },
      data: { groupId: null },
    });

    await this.invalidateCache();
  }

  /**
   * Check if user has permission to modify group
   */
  private async checkPermission(groupId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const group = await prisma.siteGroup.findUnique({ where: { id: groupId } });

    if (!group) {
      throw new Error('그룹을 찾을 수 없습니다');
    }

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    if (user.role === 'SUPER_ADMIN') return;

    if (user.role === 'HQ_ADMIN' && group.division !== 'HQ') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && group.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache() {
    const keys = await cache.keys('site-groups:*');
    if (keys.length > 0) {
      await cache.del(...keys);
    }
    // Also invalidate sites cache
    const siteKeys = await cache.keys('sites:*');
    if (siteKeys.length > 0) {
      await cache.del(...siteKeys);
    }
  }
}
