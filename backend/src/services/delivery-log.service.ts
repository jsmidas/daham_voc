import { prisma } from '../config/database';
import { DeliveryStatus } from '@prisma/client';
import { calculateDistance } from '../utils/geofencing.util';

export interface CreateDeliveryLogDto {
  routeId: string;
  siteId: string;
  driverId: string;
  deliveryDate: Date;
  stopNumber: number;
}

export interface CheckInDto {
  latitude: number;
  longitude: number;
}

export interface CheckOutDto {
  latitude: number;
  longitude: number;
  note?: string;
  issueReported?: boolean;
  issueDetail?: string;
}

export interface DeliveryLogFilter {
  routeId?: string;
  siteId?: string;
  driverId?: string;
  deliveryDate?: Date;
  status?: DeliveryStatus;
}

export class DeliveryLogService {
  /**
   * Create delivery log (배송 시작)
   */
  async createDeliveryLog(data: CreateDeliveryLogDto) {
    // Check if log already exists
    const existing = await prisma.deliveryLog.findUnique({
      where: {
        routeId_siteId_deliveryDate: {
          routeId: data.routeId,
          siteId: data.siteId,
          deliveryDate: data.deliveryDate,
        },
      },
    });

    if (existing) {
      throw new Error('이미 해당 날짜에 배송 기록이 존재합니다');
    }

    return prisma.deliveryLog.create({
      data: {
        routeId: data.routeId,
        siteId: data.siteId,
        driverId: data.driverId,
        deliveryDate: data.deliveryDate,
        stopNumber: data.stopNumber,
        status: 'PENDING',
      },
      include: {
        route: true,
        site: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Check in at site (도착 체크인)
   */
  async checkIn(logId: string, data: CheckInDto) {
    const log = await prisma.deliveryLog.findUnique({
      where: { id: logId },
      include: { site: true },
    });

    if (!log) {
      throw new Error('배송 기록을 찾을 수 없습니다');
    }

    if (log.status !== 'PENDING' && log.status !== 'IN_TRANSIT') {
      throw new Error('체크인할 수 없는 상태입니다');
    }

    // Verify location is near site (100m radius)
    const distance = calculateDistance(
      { lat: data.latitude, lng: data.longitude },
      { lat: log.site.latitude, lng: log.site.longitude }
    );

    if (distance > 100) {
      throw new Error(
        `사업장과 거리가 너무 멉니다 (${Math.round(distance)}m). 100m 이내에서 체크인해주세요.`
      );
    }

    return prisma.deliveryLog.update({
      where: { id: logId },
      data: {
        status: 'ARRIVED',
        arrivedAt: new Date(),
        arrivalLat: data.latitude,
        arrivalLng: data.longitude,
      },
      include: {
        route: true,
        site: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Check out from site (출발 체크아웃)
   */
  async checkOut(logId: string, data: CheckOutDto) {
    const log = await prisma.deliveryLog.findUnique({
      where: { id: logId },
      include: { site: true },
    });

    if (!log) {
      throw new Error('배송 기록을 찾을 수 없습니다');
    }

    if (log.status !== 'ARRIVED') {
      throw new Error('체크아웃할 수 없는 상태입니다');
    }

    if (!log.arrivedAt) {
      throw new Error('체크인을 먼저 해주세요');
    }

    // Calculate duration
    const arrivedAt = new Date(log.arrivedAt);
    const departedAt = new Date();
    const durationMinutes = Math.round((departedAt.getTime() - arrivedAt.getTime()) / 1000 / 60);

    // Calculate distance traveled (if we have previous departure location)
    let distanceKm: number | undefined;
    if (log.departureLat && log.departureLng) {
      const distanceMeters = calculateDistance(
        { lat: log.departureLat, lng: log.departureLng },
        { lat: data.latitude, lng: data.longitude }
      );
      distanceKm = distanceMeters / 1000;
    }

    return prisma.deliveryLog.update({
      where: { id: logId },
      data: {
        status: 'COMPLETED',
        departedAt,
        departureLat: data.latitude,
        departureLng: data.longitude,
        actualDuration: durationMinutes,
        distanceKm,
        note: data.note,
        issueReported: data.issueReported || false,
        issueDetail: data.issueDetail,
      },
      include: {
        route: true,
        site: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Get delivery logs with filters
   */
  async getDeliveryLogs(filter: DeliveryLogFilter) {
    const where: any = {};

    if (filter.routeId) where.routeId = filter.routeId;
    if (filter.siteId) where.siteId = filter.siteId;
    if (filter.driverId) where.driverId = filter.driverId;
    if (filter.deliveryDate) where.deliveryDate = filter.deliveryDate;
    if (filter.status) where.status = filter.status;

    return prisma.deliveryLog.findMany({
      where,
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
            color: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { deliveryDate: 'desc' },
        { stopNumber: 'asc' },
      ],
    });
  }

  /**
   * Get delivery log by ID
   */
  async getDeliveryLogById(id: string) {
    const log = await prisma.deliveryLog.findUnique({
      where: { id },
      include: {
        route: true,
        site: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!log) {
      throw new Error('배송 기록을 찾을 수 없습니다');
    }

    return log;
  }

  /**
   * Get driver's today delivery logs
   */
  async getDriverTodayLogs(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.deliveryLog.findMany({
      where: {
        driverId,
        deliveryDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        route: {
          select: {
            id: true,
            code: true,
            name: true,
            color: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        stopNumber: 'asc',
      },
    });
  }

  /**
   * Initialize daily delivery logs for a route
   */
  async initializeDailyLogs(routeId: string, driverId: string, deliveryDate: Date) {
    // Get route with stops
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        routeStops: {
          where: { isActive: true },
          include: { site: true },
          orderBy: { stopNumber: 'asc' },
        },
      },
    });

    if (!route) {
      throw new Error('배송 코스를 찾을 수 없습니다');
    }

    if (route.routeStops.length === 0) {
      throw new Error('배송 코스에 등록된 사업장이 없습니다');
    }

    // Check if logs already exist
    const existing = await prisma.deliveryLog.findMany({
      where: {
        routeId,
        deliveryDate,
      },
    });

    if (existing.length > 0) {
      throw new Error('이미 해당 날짜의 배송 기록이 생성되어 있습니다');
    }

    // Create logs for all stops
    const logs = await prisma.$transaction(
      route.routeStops.map((stop) =>
        prisma.deliveryLog.create({
          data: {
            routeId,
            siteId: stop.siteId,
            driverId,
            deliveryDate,
            stopNumber: stop.stopNumber,
            status: 'PENDING',
          },
        })
      )
    );

    return logs;
  }

  /**
   * Delete delivery log
   */
  async deleteDeliveryLog(id: string) {
    const log = await prisma.deliveryLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new Error('배송 기록을 찾을 수 없습니다');
    }

    return prisma.deliveryLog.delete({
      where: { id },
    });
  }
}
