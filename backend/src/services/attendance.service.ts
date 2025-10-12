/**
 * Attendance Service
 * @description 출퇴근 관리 CRUD 및 비즈니스 로직
 */


import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AttendanceStatus } from '@prisma/client';
import { checkGeofencing, Coordinates } from '../utils/geofencing.util';

export interface CheckInDto {
  siteId: string;
  latitude: number;
  longitude: number;
  note?: string;
}

export interface CheckOutDto {
  latitude: number;
  longitude: number;
  note?: string;
}

export interface AttendanceFilter {
  siteId?: string;
  siteIds?: string[];
  userId?: string;
  status?: AttendanceStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AttendanceSettingDto {
  siteId: string;
  expectedCheckIn: string;
  expectedCheckOut: string;
  allowedRadius?: number;
}

/**
 * 체크인
 */
export async function checkIn(dto: CheckInDto, userId: string): Promise<any> {
  // 사업장 조회
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
  });

  if (!site) {
    throw new Error('Site not found');
  }

  // 오늘 이미 체크인했는지 확인
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingCheckIn = await prisma.attendance.findFirst({
    where: {
      userId,
      siteId: dto.siteId,
      checkInTime: {
        gte: today,
        lt: tomorrow,
      },
      deletedAt: null,
    },
  });

  if (existingCheckIn) {
    throw new Error('Already checked in today');
  }

  // GPS 검증
  const userCoord: Coordinates = {
    lat: dto.latitude,
    lng: dto.longitude,
  };

  const siteCoord: Coordinates = {
    lat: site.latitude,
    lng: site.longitude,
  };

  // 출퇴근 설정 조회
  const setting = await prisma.attendanceSetting.findFirst({
    where: { siteId: dto.siteId, isActive: true },
  });

  const allowedRadius = setting?.allowedRadius || 30;
  const isWithinRange = checkGeofencing(userCoord, siteCoord, allowedRadius);

  // 상태 판단
  let status: AttendanceStatus = 'NORMAL';

  if (!isWithinRange) {
    status = 'OUTSIDE_RANGE';
    // GPS 범위 밖이어도 기록은 하되 상태를 OUTSIDE_RANGE로 설정
  }

  // 지각 여부 확인
  if (setting && status !== 'OUTSIDE_RANGE') {
    const checkInTime = new Date();
    const [hour, minute] = setting.expectedCheckIn.split(':').map(Number);
    const expectedTime = new Date(checkInTime);
    expectedTime.setHours(hour, minute, 0, 0);

    if (checkInTime > expectedTime) {
      status = 'LATE';
    }
  }

  // 체크인 기록 생성
  const attendance = await prisma.attendance.create({
    data: {
      userId,
      siteId: dto.siteId,
      checkInTime: new Date(),
      checkInLat: dto.latitude,
      checkInLng: dto.longitude,
      status,
      note: dto.note,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateAttendanceCache(dto.siteId);

  return attendance;
}

/**
 * 체크아웃
 */
export async function checkOut(
  attendanceId: string,
  dto: CheckOutDto,
  userId: string
): Promise<any> {
  // 출퇴근 기록 조회
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { site: true },
  });

  if (!attendance || attendance.deletedAt) {
    throw new Error('Attendance not found');
  }

  if (attendance.userId !== userId) {
    throw new Error('Not authorized to check out this attendance');
  }

  if (attendance.checkOutTime) {
    throw new Error('Already checked out');
  }

  // GPS 검증
  const userCoord: Coordinates = {
    lat: dto.latitude,
    lng: dto.longitude,
  };

  const siteCoord: Coordinates = {
    lat: attendance.site.latitude,
    lng: attendance.site.longitude,
  };

  // 출퇴근 설정 조회
  const setting = await prisma.attendanceSetting.findFirst({
    where: { siteId: attendance.siteId, isActive: true },
  });

  const allowedRadius = setting?.allowedRadius || 30;
  const isWithinRange = checkGeofencing(userCoord, siteCoord, allowedRadius);

  let status = attendance.status;

  if (!isWithinRange && status !== 'OUTSIDE_RANGE') {
    status = 'OUTSIDE_RANGE';
  }

  // 조퇴 여부 확인
  if (setting && status === 'NORMAL') {
    const checkOutTime = new Date();
    const [hour, minute] = setting.expectedCheckOut.split(':').map(Number);
    const expectedTime = new Date(checkOutTime);
    expectedTime.setHours(hour, minute, 0, 0);

    if (checkOutTime < expectedTime) {
      status = 'EARLY_LEAVE';
    }
  }

  // 체크아웃 기록
  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      checkOutTime: new Date(),
      checkOutLat: dto.latitude,
      checkOutLng: dto.longitude,
      status,
      note: dto.note || attendance.note,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateAttendanceCache(attendance.siteId);

  return updated;
}

/**
 * 출퇴근 목록 조회
 */
export async function getAttendances(filter: AttendanceFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `attendances:${JSON.stringify(filter)}`;

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

  if (filter.userId) {
    where.userId = filter.userId;
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.checkInTime = {};
    if (filter.dateFrom) where.checkInTime.gte = filter.dateFrom;
    if (filter.dateTo) where.checkInTime.lte = filter.dateTo;
  }

  // 조회
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      site: {
        select: { id: true, name: true, type: true },
      },
    },
    orderBy: [{ checkInTime: 'desc' }],
  });

  // 캐시 저장 (10분)
  await cache.set(cacheKey, JSON.stringify(attendances), 600);

  return attendances;
}

/**
 * 출퇴근 상세 조회
 */
export async function getAttendanceById(id: string): Promise<any> {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      site: {
        select: { id: true, name: true, type: true, division: true },
      },
    },
  });

  if (!attendance || attendance.deletedAt) {
    throw new Error('Attendance not found');
  }

  return attendance;
}

/**
 * 오늘의 출퇴근 기록 조회
 */
export async function getTodayAttendance(
  userId: string,
  siteId: string
): Promise<any | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      siteId,
      checkInTime: {
        gte: today,
        lt: tomorrow,
      },
      deletedAt: null,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  return attendance;
}

/**
 * 출퇴근 설정 생성/수정
 */
export async function upsertAttendanceSetting(
  dto: AttendanceSettingDto,
  _userId: string
): Promise<any> {
  // 기존 설정 확인
  const existing = await prisma.attendanceSetting.findFirst({
    where: { siteId: dto.siteId },
  });

  if (existing) {
    // 수정
    return prisma.attendanceSetting.update({
      where: { id: existing.id },
      data: {
        expectedCheckIn: dto.expectedCheckIn,
        expectedCheckOut: dto.expectedCheckOut,
        allowedRadius: dto.allowedRadius || 30,
      },
      include: {
        site: {
          select: { id: true, name: true, type: true },
        },
      },
    });
  } else {
    // 생성
    return prisma.attendanceSetting.create({
      data: {
        siteId: dto.siteId,
        expectedCheckIn: dto.expectedCheckIn,
        expectedCheckOut: dto.expectedCheckOut,
        allowedRadius: dto.allowedRadius || 30,
      },
      include: {
        site: {
          select: { id: true, name: true, type: true },
        },
      },
    });
  }
}

/**
 * 출퇴근 설정 조회
 */
export async function getAttendanceSetting(siteId: string): Promise<any | null> {
  return prisma.attendanceSetting.findFirst({
    where: { siteId, isActive: true },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });
}

/**
 * 캐시 무효화
 */
async function invalidateAttendanceCache(siteId: string): Promise<void> {
  const keys = await cache.keys(`attendances:*${siteId}*`);
  if (keys.length > 0) {
    await cache.del(...keys);
  }
}

/**
 * 출퇴근 통계
 */
export async function getAttendanceStatistics(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const attendances = await prisma.attendance.findMany({
    where: {
      siteId,
      checkInTime: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
    select: {
      status: true,
      checkInTime: true,
      checkOutTime: true,
    },
  });

  // 통계 집계
  const stats = {
    total: attendances.length,
    byStatus: {} as Record<string, number>,
    checkedOut: 0,
    notCheckedOut: 0,
  };

  attendances.forEach((attendance) => {
    // Status 집계
    stats.byStatus[attendance.status] = (stats.byStatus[attendance.status] || 0) + 1;

    // 체크아웃 여부
    if (attendance.checkOutTime) {
      stats.checkedOut++;
    } else {
      stats.notCheckedOut++;
    }
  });

  return stats;
}

/**
 * 사용자별 출퇴근 기록 조회
 */
export async function getUserAttendances(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any[]> {
  return prisma.attendance.findMany({
    where: {
      userId,
      checkInTime: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
    },
    orderBy: { checkInTime: 'desc' },
  });
}

/**
 * 사용자 조회 (siteId 포함)
 */
export async function getUserById(userId: string): Promise<{ id: string; name: string; siteId?: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staff: {
        include: {
          staffSites: {
            where: {
              removedAt: null,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  // 주 담당 사업장 또는 첫 번째 사업장의 siteId 추출
  const primarySite = user.staff?.staffSites.find((ss) => ss.isPrimary);
  const siteId = primarySite?.siteId || user.staff?.staffSites[0]?.siteId;

  return {
    id: user.id,
    name: user.name,
    siteId,
  };
}

/**
 * 첫 번째 활성 사업장 조회
 */
export async function getFirstActiveSite(): Promise<{ id: string } | null> {
  return prisma.site.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * 출퇴근 테이블 조회 (사업장명, 성명, 평일/주말, 출근/퇴근 시간, 휴게시간)
 */
export async function getAttendanceTable(filter: AttendanceFilter): Promise<any[]> {
  const where: any = {
    deletedAt: null,
  };

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.siteIds && filter.siteIds.length > 0) {
    where.siteId = { in: filter.siteIds };
  }

  if (filter.userId) {
    where.userId = filter.userId;
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.checkInTime = {};
    if (filter.dateFrom) where.checkInTime.gte = filter.dateFrom;
    if (filter.dateTo) where.checkInTime.lte = filter.dateTo;
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true },
      },
      site: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ checkInTime: 'desc' }],
  });

  // 테이블 형식으로 데이터 포맷팅
  return attendances.map((att) => {
    const checkInDate = new Date(att.checkInTime);
    const dayOfWeek = checkInDate.getDay(); // 0 (일요일) ~ 6 (토요일)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 시간 포맷: HH:MM:SS
    const formatTime = (date: Date | null | undefined): string => {
      if (!date) return '-';
      const d = new Date(date);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    // 휴게시간 계산 (분 단위)
    let breakDuration = 0;
    if (att.breakStartTime && att.breakEndTime) {
      const start = new Date(att.breakStartTime);
      const end = new Date(att.breakEndTime);
      breakDuration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // 분 단위
    }

    return {
      id: att.id,
      siteName: att.site.name,
      userName: att.user.name,
      dayType: isWeekend ? '주말' : '평일',
      checkInTime: formatTime(att.checkInTime),
      checkOutTime: formatTime(att.checkOutTime),
      breakDuration: breakDuration > 0 ? `${breakDuration}분` : '-',
      status: att.status,
      date: checkInDate.toISOString().split('T')[0], // YYYY-MM-DD
    };
  });
}

/**
 * 출퇴근 정보 수정 (휴게시간 등)
 */
export async function updateAttendance(
  id: string,
  data: {
    breakStartTime?: Date | null;
    breakEndTime?: Date | null;
    note?: string;
  }
): Promise<any> {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
  });

  if (!attendance || attendance.deletedAt) {
    throw new Error('Attendance not found');
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      breakStartTime: data.breakStartTime,
      breakEndTime: data.breakEndTime,
      note: data.note,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      site: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateAttendanceCache(attendance.siteId);

  return updated;
}
