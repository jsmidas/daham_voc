/**
 * Meal Count Service
 * @description 식수 인원 관리 서비스
 */

import { MealType } from '@prisma/client';
import { prisma } from '../config/database';

export interface CreateMealCountDTO {
  siteId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  menuNumber?: number;
  mealMenuId?: string;
  count: number;
  submittedBy: string;
  note?: string;
}

export interface UpdateMealCountDTO {
  count?: number;
  note?: string;
}

/**
 * 과거 날짜인지 확인 (오늘 이전 날짜)
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate < today;
}

/**
 * 식수 인원 등록 (upsert 방식 - 이미 존재하면 업데이트)
 */
export async function createMealCount(data: CreateMealCountDTO) {
  // 마감 시간 체크
  const setting = await prisma.mealCountSetting.findUnique({
    where: { siteId: data.siteId },
  });

  let isLate = false;
  if (setting && setting.isActive) {
    const targetDate = new Date(data.date);
    const now = new Date();

    // 조리 시작 시간 가져오기
    let startTime: string | null = null;
    if (data.mealType === 'BREAKFAST') startTime = setting.breakfastStartTime;
    else if (data.mealType === 'LUNCH') startTime = setting.lunchStartTime;
    else if (data.mealType === 'DINNER') startTime = setting.dinnerStartTime;

    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const deadline = new Date(targetDate);
      deadline.setHours(hours, minutes, 0, 0);
      deadline.setHours(deadline.getHours() - (setting.deadlineHoursBefore ?? 0));

      if (now > deadline) {
        isLate = true;
        if (!setting.allowLateSubmission) {
          throw new Error('식수 입력 마감 시간이 지났습니다');
        }
      }
    }
  }

  const dateObj = new Date(data.date);
  const menuNumber = data.menuNumber || 1;

  // upsert를 사용하여 이미 존재하면 업데이트, 없으면 생성
  return await prisma.mealCount.upsert({
    where: {
      siteId_date_mealType_menuNumber: {
        siteId: data.siteId,
        date: dateObj,
        mealType: data.mealType,
        menuNumber: menuNumber,
      },
    },
    create: {
      siteId: data.siteId,
      date: dateObj,
      mealType: data.mealType,
      menuNumber: menuNumber,
      mealMenuId: data.mealMenuId,
      count: data.count,
      submittedBy: data.submittedBy,
      note: data.note,
      isLate,
    },
    update: {
      mealMenuId: data.mealMenuId,
      count: data.count,
      submittedBy: data.submittedBy,
      note: data.note,
      isLate,
    },
    include: {
      site: {
        select: {
          id: true,
          name: true,
        },
      },
      submitter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * 식수 인원 수정
 */
export async function updateMealCount(id: string, data: UpdateMealCountDTO) {
  return await prisma.mealCount.update({
    where: { id },
    data,
    include: {
      site: {
        select: {
          id: true,
          name: true,
        },
      },
      submitter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * 식수 인원 삭제
 */
export async function deleteMealCount(id: string) {
  return await prisma.mealCount.delete({
    where: { id },
  });
}

/**
 * 식수 인원 조회 (단일)
 */
export async function getMealCount(id: string) {
  return await prisma.mealCount.findUnique({
    where: { id },
    include: {
      site: {
        select: {
          id: true,
          name: true,
        },
      },
      submitter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * 사업장 날짜별 식수 인원 조회
 */
export async function getMealCountsByDate(siteId: string, date: string) {
  return await prisma.mealCount.findMany({
    where: {
      siteId,
      date: new Date(date),
    },
    include: {
      submitter: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
    orderBy: {
      mealType: 'asc',
    },
  });
}

/**
 * 사업장 기간별 식수 인원 조회
 */
export async function getMealCountsByRange(
  siteId: string,
  startDate: string,
  endDate: string
) {
  return await prisma.mealCount.findMany({
    where: {
      siteId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      submitter: {
        select: {
          id: true,
          name: true,
        },
      },
      mealMenu: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { date: 'asc' },
      { mealType: 'asc' },
    ],
  });
}

/**
 * 전체 사업장 기간별 식수 인원 조회
 */
export async function getAllMealCountsByRange(startDate: string, endDate: string) {
  return await prisma.mealCount.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      site: {
        select: {
          id: true,
          name: true,
          division: true,
          type: true,
        },
      },
      submitter: {
        select: {
          id: true,
          name: true,
        },
      },
      mealMenu: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { site: { name: 'asc' } },
      { date: 'asc' },
      { mealType: 'asc' },
    ],
  });
}

/**
 * 전체 사업장 식수 설정 조회
 */
export async function getAllMealCountSettings() {
  return await prisma.mealCountSetting.findMany({
    include: {
      site: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      siteId: 'asc',
    },
  });
}

/**
 * 사업장 식수 설정 조회
 */
export async function getMealCountSetting(siteId: string) {
  return await prisma.mealCountSetting.findUnique({
    where: { siteId },
  });
}

/**
 * 사업장 식수 설정 생성/수정
 */
export async function upsertMealCountSetting(siteId: string, data: any) {
  // undefined 값 제거 (Prisma는 undefined를 허용하지 않음)
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  return await prisma.mealCountSetting.upsert({
    where: { siteId },
    create: {
      siteId,
      ...cleanData,
    },
    update: cleanData,
  });
}
