import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import {
  CreateDeliveryRouteDto,
  UpdateDeliveryRouteDto,
  AddSiteToRouteDto,
  UpdateRouteStopsDto,
  AssignDriverDto,
  DeliveryRouteResponse,
  DeliveryRouteDetailResponse,
} from '../types/delivery-route.types';

export class DeliveryRouteService {
  /**
   * 배송 코스 목록 조회
   */
  async getDeliveryRoutes(filters: {
    division?: 'HQ' | 'YEONGNAM';
    isActive?: boolean;
    search?: string;
  }): Promise<DeliveryRouteResponse[]> {
    const where: Prisma.DeliveryRouteWhereInput = {
      deletedAt: null,
    };

    if (filters.division) {
      where.division = filters.division;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const routes = await prisma.deliveryRoute.findMany({
      where,
      include: {
        routeStops: {
          where: { isActive: true },
        },
        assignments: {
          where: { isActive: true },
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [{ division: 'asc' }, { code: 'asc' }],
    });

    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      code: route.code,
      division: route.division,
      description: route.description || undefined,
      color: route.color,
      isActive: route.isActive,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      stopsCount: route.routeStops.length,
      assignedDrivers: route.assignments.map((a) => a.driver),
    }));
  }

  /**
   * 배송 코스 상세 조회
   */
  async getDeliveryRouteById(id: string): Promise<DeliveryRouteDetailResponse> {
    const route = await prisma.deliveryRoute.findUnique({
      where: { id },
      include: {
        routeStops: {
          where: { isActive: true },
          include: {
            site: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                type: true,
              },
            },
          },
          orderBy: { stopNumber: 'asc' },
        },
        assignments: {
          where: { isActive: true },
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!route || route.deletedAt) {
      throw new Error('배송 코스를 찾을 수 없습니다');
    }

    return {
      id: route.id,
      name: route.name,
      code: route.code,
      division: route.division,
      description: route.description || undefined,
      color: route.color,
      isActive: route.isActive,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      stopsCount: route.routeStops.length,
      assignedDrivers: route.assignments.map((a) => a.driver),
      stops: route.routeStops.map((stop) => ({
        id: stop.id,
        stopNumber: stop.stopNumber,
        estimatedArrival: stop.estimatedArrival || undefined,
        estimatedDuration: stop.estimatedDuration || undefined,
        notes: stop.notes || undefined,
        site: stop.site,
      })),
    };
  }

  /**
   * 배송 코스 생성
   */
  async createDeliveryRoute(data: CreateDeliveryRouteDto): Promise<DeliveryRouteResponse> {
    // 중복 검사
    const existingRoute = await prisma.deliveryRoute.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
        deletedAt: null,
      },
    });

    if (existingRoute) {
      throw new Error('이미 존재하는 코스명 또는 코드입니다');
    }

    const route = await prisma.deliveryRoute.create({
      data: {
        name: data.name,
        code: data.code,
        division: data.division,
        description: data.description,
        color: data.color || '#1890ff',
      },
      include: {
        routeStops: true,
        assignments: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    return {
      id: route.id,
      name: route.name,
      code: route.code,
      division: route.division,
      description: route.description || undefined,
      color: route.color,
      isActive: route.isActive,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      stopsCount: 0,
      assignedDrivers: [],
    };
  }

  /**
   * 배송 코스 수정
   */
  async updateDeliveryRoute(
    id: string,
    data: UpdateDeliveryRouteDto
  ): Promise<DeliveryRouteResponse> {
    const route = await prisma.deliveryRoute.update({
      where: { id },
      data,
      include: {
        routeStops: {
          where: { isActive: true },
        },
        assignments: {
          where: { isActive: true },
          include: {
            driver: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    return {
      id: route.id,
      name: route.name,
      code: route.code,
      division: route.division,
      description: route.description || undefined,
      color: route.color,
      isActive: route.isActive,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      stopsCount: route.routeStops.length,
      assignedDrivers: route.assignments.map((a) => a.driver),
    };
  }

  /**
   * 배송 코스 삭제 (소프트 삭제)
   */
  async deleteDeliveryRoute(id: string): Promise<void> {
    await prisma.deliveryRoute.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * 코스에 사업장 추가
   */
  async addSiteToRoute(routeId: string, data: AddSiteToRouteDto): Promise<void> {
    // 코스 존재 확인
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
    });

    if (!route || route.deletedAt) {
      throw new Error('배송 코스를 찾을 수 없습니다');
    }

    // 사업장 존재 확인
    const site = await prisma.site.findUnique({
      where: { id: data.siteId },
    });

    if (!site || site.deletedAt) {
      throw new Error('사업장을 찾을 수 없습니다');
    }

    // 중복 확인
    const existing = await prisma.deliveryRouteStop.findUnique({
      where: {
        routeId_siteId: {
          routeId,
          siteId: data.siteId,
        },
      },
    });

    if (existing) {
      throw new Error('이미 해당 코스에 등록된 사업장입니다');
    }

    // 순서 중복 확인
    const stopNumberExists = await prisma.deliveryRouteStop.findUnique({
      where: {
        routeId_stopNumber: {
          routeId,
          stopNumber: data.stopNumber,
        },
      },
    });

    if (stopNumberExists) {
      throw new Error('이미 사용 중인 순서 번호입니다');
    }

    await prisma.deliveryRouteStop.create({
      data: {
        routeId,
        siteId: data.siteId,
        stopNumber: data.stopNumber,
        estimatedArrival: data.estimatedArrival,
        estimatedDuration: data.estimatedDuration,
        notes: data.notes,
      },
    });
  }

  /**
   * 코스에서 사업장 제거
   */
  async removeSiteFromRoute(routeId: string, siteId: string): Promise<void> {
    await prisma.deliveryRouteStop.update({
      where: {
        routeId_siteId: {
          routeId,
          siteId,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * 코스 사업장 순서 일괄 업데이트
   */
  async updateRouteStops(_routeId: string, data: UpdateRouteStopsDto): Promise<void> {
    // 트랜잭션으로 일괄 업데이트
    await prisma.$transaction(
      data.stops.map((stop) =>
        prisma.deliveryRouteStop.update({
          where: { id: stop.id },
          data: { stopNumber: stop.stopNumber },
        })
      )
    );
  }

  /**
   * 기사 배정
   */
  async assignDrivers(data: AssignDriverDto): Promise<void> {
    const { routeId, driverIds } = data;

    // 기존 배정 비활성화
    await prisma.deliveryAssignment.updateMany({
      where: {
        routeId,
        isActive: true,
      },
      data: {
        isActive: false,
        removedAt: new Date(),
      },
    });

    // 새 배정 생성
    await prisma.deliveryAssignment.createMany({
      data: driverIds.map((driverId) => ({
        routeId,
        driverId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * 배송기사의 배정된 코스 조회
   */
  async getDriverRoutes(driverId: string): Promise<DeliveryRouteDetailResponse[]> {
    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        driverId,
        isActive: true,
      },
      include: {
        route: {
          include: {
            routeStops: {
              where: { isActive: true },
              include: {
                site: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    type: true,
                  },
                },
              },
              orderBy: { stopNumber: 'asc' },
            },
            assignments: {
              where: { isActive: true },
              include: {
                driver: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        },
      },
    });

    return assignments.map((assignment) => {
      const route = assignment.route;
      return {
        id: route.id,
        name: route.name,
        code: route.code,
        division: route.division,
        description: route.description || undefined,
        color: route.color,
        isActive: route.isActive,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
        stopsCount: route.routeStops.length,
        assignedDrivers: route.assignments.map((a) => a.driver),
        stops: route.routeStops.map((stop) => ({
          id: stop.id,
          stopNumber: stop.stopNumber,
          estimatedArrival: stop.estimatedArrival || undefined,
          estimatedDuration: stop.estimatedDuration || undefined,
          notes: stop.notes || undefined,
          site: stop.site,
        })),
      };
    });
  }
}
