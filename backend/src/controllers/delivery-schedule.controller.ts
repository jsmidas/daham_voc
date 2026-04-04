/**
 * Delivery Schedule Controller
 * @description 배송 스케줄 관리 컨트롤러
 */

import { Request, Response } from 'express';
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

// ============ 스케줄 ============

/** GET /delivery-schedules */
export async function getSchedules(req: Request, res: Response): Promise<void> {
  try {
    const { routeId, driverId, dayOfWeek } = req.query;
    const result = await scheduleService.getSchedules({
      routeId: routeId as string,
      driverId: driverId as string,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek as string) : undefined,
    });
    res.json(successResponse(result));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

/** POST /delivery-schedules */
export async function upsertSchedule(req: Request, res: Response): Promise<void> {
  try {
    const result = await scheduleService.upsertSchedule(req.body);
    res.json(successResponse(result, '스케줄이 저장되었습니다'));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

/** POST /delivery-schedules/bulk */
export async function bulkUpsertSchedules(req: Request, res: Response): Promise<void> {
  try {
    const { schedules } = req.body;
    const result = await scheduleService.bulkUpsertSchedules(schedules);
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
