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

    // 기존 등록 확인 (활성/비활성 모두)
    const existing = await prisma.deliveryRouteStop.findUnique({
      where: {
        routeId_siteId: {
          routeId,
          siteId: data.siteId,
        },
      },
    });

    // 이미 활성 상태로 등록되어 있으면 에러
    if (existing && existing.isActive) {
      throw new Error('이미 해당 코스에 등록된 사업장입니다');
    }

    // 트랜잭션으로 처리: 순서 번호 중복 시 기존 항목들의 번호를 밀어냄
    await prisma.$transaction(async (tx) => {
      // 해당 순서 번호 이상의 기존 항목들 조회
      const existingStops = await tx.deliveryRouteStop.findMany({
        where: {
          routeId,
          stopNumber: { gte: data.stopNumber },
          isActive: true,
        },
        orderBy: { stopNumber: 'desc' }, // 큰 번호부터 처리해야 충돌 방지
      });

      // 기존 항목들의 순서 번호를 +1씩 밀어냄 (큰 번호부터)
      for (const stop of existingStops) {
        await tx.deliveryRouteStop.update({
          where: { id: stop.id },
          data: { stopNumber: stop.stopNumber + 1 },
        });
      }

      // 비활성화된 기존 항목이 있으면 재활성화, 없으면 새로 생성
      if (existing) {
        await tx.deliveryRouteStop.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            stopNumber: data.stopNumber,
            estimatedArrival: data.estimatedArrival,
            estimatedDuration: data.estimatedDuration,
            notes: data.notes,
          },
        });
      } else {
        await tx.deliveryRouteStop.create({
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
  async updateRouteStops(routeId: string, data: UpdateRouteStopsDto): Promise<void> {
    // 순서 변경 시 unique constraint 충돌을 피하기 위해
    // 먼저 모든 stopNumber를 음수로 설정한 후 새 순서로 업데이트
    await prisma.$transaction(async (tx) => {
      // 0단계: 해당 코스의 모든 비활성 사업장도 임시값으로 변경 (충돌 방지)
      const inactiveStops = await tx.deliveryRouteStop.findMany({
        where: { routeId, isActive: false },
      });
      for (let i = 0; i < inactiveStops.length; i++) {
        await tx.deliveryRouteStop.update({
          where: { id: inactiveStops[i].id },
          data: { stopNumber: -(i + 2000) }, // 비활성용 음수 임시값
        });
      }

      // 1단계: 활성 사업장들의 stopNumber를 임시값(음수)으로 변경
      for (let i = 0; i < data.stops.length; i++) {
        await tx.deliveryRouteStop.update({
          where: { id: data.stops[i].id },
          data: { stopNumber: -(i + 1000) }, // 음수 임시값
        });
      }

      // 2단계: 새로운 순서로 업데이트
      for (const stop of data.stops) {
        await tx.deliveryRouteStop.update({
          where: { id: stop.id },
          data: { stopNumber: stop.stopNumber },
        });
      }
    });
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
