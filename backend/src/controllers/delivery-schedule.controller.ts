/**
 * Delivery Schedule Controller
 * @description 배송 스케줄 관리 컨트롤러
 *              구 클라이언트 호환: dayOfWeek(0-6) → scheduleType 자동 변환
 */

import { Request, Response } from 'express';
import { ScheduleType } from '@prisma/client';
import * as scheduleService from '../services/delivery-schedule.service';

const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  message,
});

const errorResponse = (message: string, code?: string) => ({
  success: false,
  error: { message, code },
});

const VALID_TYPES: ScheduleType[] = ['WEEKDAY', 'SATURDAY', 'SUNDAY', 'HOLIDAY'];

/** body/query 입력을 scheduleType으로 정규화 (구 dayOfWeek도 허용) */
function normalizeScheduleType(input: any): ScheduleType | undefined {
  if (input.scheduleType) {
    const t = String(input.scheduleType).toUpperCase() as ScheduleType;
    return VALID_TYPES.includes(t) ? t : undefined;
  }
  if (input.dayOfWeek !== undefined && input.dayOfWeek !== null && input.dayOfWeek !== '') {
    const n = typeof input.dayOfWeek === 'string' ? parseInt(input.dayOfWeek) : input.dayOfWeek;
    if (Number.isInteger(n)) return scheduleService.dayOfWeekToScheduleType(n);
  }
  return undefined;
}

// ============ 스케줄 ============

/** GET /delivery-schedules */
export async function getSchedules(req: Request, res: Response): Promise<void> {
  try {
    const { routeId, driverId } = req.query;
    const scheduleType = normalizeScheduleType(req.query);
    const result = await scheduleService.getSchedules({
      routeId: routeId as string,
      driverId: driverId as string,
      scheduleType,
    });
    res.json(successResponse(result));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

/** POST /delivery-schedules */
export async function upsertSchedule(req: Request, res: Response): Promise<void> {
  try {
    const scheduleType = normalizeScheduleType(req.body);
    if (!scheduleType) {
      res.status(400).json(errorResponse('scheduleType 또는 dayOfWeek가 필요합니다'));
      return;
    }
    const result = await scheduleService.upsertSchedule({
      routeId: req.body.routeId,
      driverId: req.body.driverId,
      mealType: req.body.mealType,
      scheduleType,
    });
    res.json(successResponse(result, '스케줄이 저장되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

/** POST /delivery-schedules/bulk */
export async function bulkUpsertSchedules(req: Request, res: Response): Promise<void> {
  try {
    const { schedules } = req.body;
    if (!Array.isArray(schedules)) {
      res.status(400).json(errorResponse('schedules 배열이 필요합니다'));
      return;
    }
    const normalized = schedules.map((s: any) => {
      const scheduleType = normalizeScheduleType(s);
      if (!scheduleType) {
        throw new Error('각 스케줄에 scheduleType 또는 dayOfWeek가 필요합니다');
      }
      return {
        routeId: s.routeId,
        driverId: s.driverId,
        mealType: s.mealType,
        scheduleType,
      };
    });
    const result = await scheduleService.bulkUpsertSchedules(normalized);
    res.json(successResponse(result, `${result.length}개 스케줄이 저장되었습니다`));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

/** DELETE /delivery-schedules/:id */
export async function deleteSchedule(req: Request, res: Response): Promise<void> {
  try {
    await scheduleService.deleteSchedule(req.params.id);
    res.json(successResponse(null, '스케줄이 삭제되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

// ============ 오버라이드 ============

/** GET /delivery-schedules/overrides */
export async function getOverrides(req: Request, res: Response): Promise<void> {
  try {
    const { routeId, driverId, date } = req.query;
    const result = await scheduleService.getOverrides({
      routeId: routeId as string,
      driverId: driverId as string,
      date: date as string,
    });
    res.json(successResponse(result));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

/** POST /delivery-schedules/overrides */
export async function upsertOverride(req: Request, res: Response): Promise<void> {
  try {
    const result = await scheduleService.upsertOverride(req.body);
    res.json(successResponse(result, '배정 변경이 저장되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

/** DELETE /delivery-schedules/overrides/:id */
export async function deleteOverride(req: Request, res: Response): Promise<void> {
  try {
    await scheduleService.deleteOverride(req.params.id);
    res.json(successResponse(null, '배정 변경이 삭제되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

// ============ 오늘의 배정 ============

/** GET /delivery-schedules/today - 오늘의 배정 (기사용) */
export async function getTodayAssignments(req: Request, res: Response): Promise<void> {
  try {
    const driverId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];
    const result = await scheduleService.getAssignmentsForDate(today, driverId);
    res.json(successResponse(result));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

/** GET /delivery-schedules/date/:date - 특정 날짜 배정 (관리자용) */
export async function getAssignmentsForDate(req: Request, res: Response): Promise<void> {
  try {
    const { date } = req.params;
    const { driverId } = req.query;
    const result = await scheduleService.getAssignmentsForDate(date, driverId as string);
    res.json(successResponse(result));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
