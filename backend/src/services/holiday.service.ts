/**
 * Holiday Service
 * @description 공휴일 관리 서비스
 */

import { prisma } from '../config/database';

/**
 * 연도별 공휴일 조회
 */
export async function getHolidaysByYear(year: number) {
  return prisma.holiday.findMany({
    where: { year },
    orderBy: { date: 'asc' },
  });
}

/**
 * 공휴일 추가
 */
export async function createHoliday(data: { date: string; name: string }) {
  const dateObj = new Date(data.date);
  dateObj.setHours(0, 0, 0, 0);
  const year = dateObj.getFullYear();

  // 중복 체크
  const existing = await prisma.holiday.findUnique({
    where: { date: dateObj },
  });
  if (existing) {
    throw new Error('이미 등록된 날짜입니다');
  }

  return prisma.holiday.create({
    data: {
      date: dateObj,
      name: data.name,
      year,
    },
  });
}

/**
 * 공휴일 수정
 */
export async function updateHoliday(id: string, data: { name: string }) {
  return prisma.holiday.update({
    where: { id },
    data: { name: data.name },
  });
}

/**
 * 공휴일 삭제
 */
export async function deleteHoliday(id: string) {
  return prisma.holiday.delete({
    where: { id },
  });
}

/**
 * 특정 날짜가 공휴일인지 확인
 */
export async function isHoliday(date: Date): Promise<boolean> {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const holiday = await prisma.holiday.findUnique({
    where: { date: dateOnly },
  });

  return !!holiday;
}
