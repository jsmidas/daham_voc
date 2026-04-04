/**
 * Delivery Schedule Service
 * @description 배송 스케줄 관리 (요일별 기본 배정 + 일별 오버라이드)
 */

import { PrismaClient, MealType } from '@prisma/client';

const prisma = new PrismaClient();

// ============ 요일별 기본 스케줄 ============

/** 스케줄 목록 조회 (코스별, 또는 전체) */
export async function getSchedules(filter?: { routeId?: string; driverId?: string; dayOfWeek?: number }) {
  const where: any = {};
  if (filter?.routeId) where.routeId = filter.routeId;
  if (filter?.driverId) where.driverId = filter.driverId;
  if (filter?.dayOfWeek !== undefined) where.dayOfWeek = filter.dayOfWeek;

  return prisma.deliverySchedule.findMany({
    where,
    include: {
      route: { select: { id: true, name: true, code: true, division: true, color: true } },
      driver: { select: { id: true, name: true, phone: true } },
    },
    orderBy: [{ routeId: 'asc' }, { dayOfWeek: 'asc' }, { mealType: 'asc' }],
  });
}

/** 스케줄 생성/수정 (upsert) */
export async function upsertSchedule(data: {
  routeId: string;
  driverId: string;
  dayOfWeek: number;
  mealType: MealType;
}) {
  return prisma.deliverySchedule.upsert({
    where: {
      routeId_dayOfWeek_mealType: {
        routeId: data.routeId,
        dayOfWeek: data.dayOfWeek,
        mealType: data.mealType,
      },
    },
    update: { driverId: data.driverId },
    create: data,
    include: {
      route: { select: { id: true, name: true, code: true, division: true, color: true } },
      driver: { select: { id: true, name: true, phone: true } },
    },
  });
}

/** 스케줄 일괄 저장 (코스 + 요일 단위) */
export async function bulkUpsertSchedules(schedules: Array<{
  routeId: string;
  driverId: string;
  dayOfWeek: number;
  mealType: MealType;
}>) {
  const results = [];
  for (const s of schedules) {
    const result = await upsertSchedule(s);
    results.push(result);
  }
  return results;
}

/** 스케줄 삭제 */
export async function deleteSchedule(id: string) {
  return prisma.deliverySchedule.delete({ where: { id } });
}

/** 코스의 특정 요일 스케줄 전체 삭제 */
export async function deleteSchedulesByRouteDay(routeId: string, dayOfWeek: number) {
  return prisma.deliverySchedule.deleteMany({
    where: { routeId, dayOfWeek },
  });
}

// ============ 일별 오버라이드 ============

/** 오버라이드 목록 조회 */
export async function getOverrides(filter?: { routeId?: string; driverId?: string; date?: string }) {
  const where: any = {};
  if (filter?.routeId) where.routeId = filter.routeId;
  if (filter?.driverId) where.driverId = filter.driverId;
  if (filter?.date) where.date = new Date(filter.date);

  return prisma.dailyDriverOverride.findMany({
    where,
    include: {
      route: { select: { id: true, name: true, code: true, division: true, color: true } },
      driver: { select: { id: true, name: true, phone: true } },
    },
    orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
  });
}

/** 오버라이드 생성/수정 (upsert) */
export async function upsertOverride(data: {
  routeId: string;
  driverId: string;
  date: string;
  mealType: MealType;
  note?: string;
}) {
  return prisma.dailyDriverOverride.upsert({
    where: {
      routeId_date_mealType: {
        routeId: data.routeId,
        date: new Date(data.date),
        mealType: data.mealType,
      },
    },
    update: { driverId: data.driverId, note: data.note },
    create: {
      routeId: data.routeId,
      driverId: data.driverId,
      date: new Date(data.date),
      mealType: data.mealType,
      note: data.note,
    },
    include: {
      route: { select: { id: true, name: true, code: true, division: true, color: true } },
      driver: { select: { id: true, name: true, phone: true } },
    },
  });
}

/** 오버라이드 삭제 */
export async function deleteOverride(id: string) {
  return prisma.dailyDriverOverride.delete({ where: { id } });
}

// ============ 오늘의 배정 조회 (핵심 로직) ============

/**
 * 특정 날짜의 실제 배정 조회
 * 우선순위: DailyDriverOverride > DeliverySchedule > DeliveryAssignment(기존)
 */
export async function getAssignmentsForDate(date: string, driverId?: string) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0=일, 1=월, ..., 6=토

  // 1. 해당 날짜의 오버라이드 조회
  const overrideWhere: any = { date: targetDate };
  if (driverId) overrideWhere.driverId = driverId;

  const overrides = await prisma.dailyDriverOverride.findMany({
    where: overrideWhere,
    include: {
      route: {
        select: {
          id: true, name: true, code: true, division: true, color: true,
          routeStops: {
            where: { isActive: true },
            include: { site: { select: { id: true, name: true, address: true } } },
            orderBy: { stopNumber: 'asc' },
          },
        },
      },
      driver: { select: { id: true, name: true, phone: true } },
    },
  });

  // 2. 해당 요일의 기본 스케줄 조회
  const scheduleWhere: any = { dayOfWeek };
  if (driverId) scheduleWhere.driverId = driverId;

  const schedules = await prisma.deliverySchedule.findMany({
    where: scheduleWhere,
    include: {
      route: {
        select: {
          id: true, name: true, code: true, division: true, color: true,
          routeStops: {
            where: { isActive: true },
            include: { site: { select: { id: true, name: true, address: true } } },
            orderBy: { stopNumber: 'asc' },
          },
        },
      },
      driver: { select: { id: true, name: true, phone: true } },
    },
  });

  // 3. 오버라이드가 있는 코스+끼니는 오버라이드 사용, 없으면 스케줄 사용
  const overrideKeys = new Set(
    overrides.map((o) => `${o.routeId}_${o.mealType}`)
  );

  const mergedAssignments = [
    ...overrides.map((o) => ({
      ...o,
      source: 'override' as const,
    })),
    ...schedules
      .filter((s) => !overrideKeys.has(`${s.routeId}_${s.mealType}`))
      .map((s) => ({
        ...s,
        date: targetDate,
        note: null,
        source: 'schedule' as const,
      })),
  ];

  return mergedAssignments;
}
