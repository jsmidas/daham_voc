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

    // 트랜잭션으로 처리: 순서 번호 중복 방지
    await prisma.$transaction(async (tx) => {
      // 1단계: 모든 stops 조회 및 새로운 순서 계산 (메모리에서 처리)
      const allStops = await tx.deliveryRouteStop.findMany({
        where: { routeId },
        orderBy: { stopNumber: 'asc' },
      });

      // 2단계: 새로운 순서 맵 생성 (id -> newStopNumber)
      const newStopNumbers = new Map<string, number>();
      let nextNumber = 1;

      // 활성 사업장들만 추출하고, 새 사업장 위치 고려하여 순서 재계산
      const activeStops = allStops
        .filter((s) => s.isActive)
        .sort((a, b) => a.stopNumber - b.stopNumber);

      // existing이 있으면 activeStops에서 제외 (재활성화될 것이므로)
      const stopsToReorder = existing
        ? activeStops.filter((s) => s.id !== existing.id)
        : activeStops;

      // 새 사업장/재활성화 사업장이 들어갈 위치 기준으로 순서 재배치
      const insertAt = data.stopNumber;
      let inserted = false;

      for (const stop of stopsToReorder) {
        // 새 사업장 삽입 위치에 도달하면 먼저 삽입 위치 확보
        if (!inserted && nextNumber >= insertAt) {
          nextNumber++; // 새 사업장 자리 확보
          inserted = true;
        }
        newStopNumbers.set(stop.id, nextNumber);
        nextNumber++;
      }

      // 삽입 위치가 맨 뒤인 경우
      if (!inserted) {
        // 아직 삽입되지 않았으면 마지막에 넣을 예정
      }

      // 비활성 사업장들은 높은 음수값 부여 (충돌 방지)
      const inactiveStops = allStops.filter(
        (s) => !s.isActive && (!existing || s.id !== existing.id)
      );
      let negativeNumber = -10000;
      for (const stop of inactiveStops) {
        newStopNumbers.set(stop.id, negativeNumber);
        negativeNumber--;
      }

      // 3단계: 모든 기존 stops를 임시 음수값으로 변경 (unique constraint 회피)
      const timestamp = Date.now();
      for (let i = 0; i < allStops.length; i++) {
        await tx.deliveryRouteStop.update({
          where: { id: allStops[i].id },
          data: { stopNumber: -(timestamp % 100000) - (i + 1) },
        });
      }

      // 4단계: 계산된 새 순서로 업데이트
      for (const [stopId, newNumber] of newStopNumbers) {
        await tx.deliveryRouteStop.update({
          where: { id: stopId },
          data: { stopNumber: newNumber },
        });
      }

      // 5단계: 비활성화된 기존 항목이 있으면 재활성화, 없으면 새로 생성
      if (existing) {
        await tx.deliveryRouteStop.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            stopNumber: insertAt,
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
            stopNumber: insertAt,
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
      // 1단계: 해당 코스의 모든 사업장 조회
      const allStops = await tx.deliveryRouteStop.findMany({
        where: { routeId },
      });

      // 2단계: 모든 stops를 고유한 임시 음수값으로 변경 (충돌 방지)
      const timestamp = Date.now();
      for (let i = 0; i < allStops.length; i++) {
        await tx.deliveryRouteStop.update({
          where: { id: allStops[i].id },
          data: { stopNumber: -(timestamp % 100000) - (i + 1) },
        });
      }

      // 3단계: 요청된 활성 사업장들을 새 순서로 업데이트
      for (const stop of data.stops) {
        await tx.deliveryRouteStop.update({
          where: { id: stop.id },
          data: { stopNumber: stop.stopNumber },
        });
      }

      // 4단계: 비활성 사업장들은 높은 음수값 유지
      const requestedIds = new Set(data.stops.map((s) => s.id));
      const inactiveStops = allStops.filter((s) => !requestedIds.has(s.id));
      for (let i = 0; i < inactiveStops.length; i++) {
        await tx.deliveryRouteStop.update({
          where: { id: inactiveStops[i].id },
          data: { stopNumber: -(10000 + i) },
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
