/**
 * Attendance Controller
 * @description 출퇴근 관리 API 엔드포인트
 */

import { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { AttendanceStatus } from '@prisma/client';

/**
 * 체크인
 * POST /api/v1/attendances/check-in
 */
export async function checkIn(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, latitude, longitude, note } = req.body;
    const userId = req.user!.userId;

    const attendance = await attendanceService.checkIn(
      {
        siteId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        note,
      },
      userId
    );

    res.status(201).json(successResponse(attendance, '체크인 되었습니다.'));
  } catch (error: any) {
    console.error('Check in error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 체크아웃
 * POST /api/v1/attendances/:id/check-out
 */
export async function checkOut(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { latitude, longitude, note } = req.body;
    const userId = req.user!.userId;

    const attendance = await attendanceService.checkOut(
      id,
      {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        note,
      },
      userId
    );

    res.json(successResponse(attendance, '체크아웃 되었습니다.'));
  } catch (error: any) {
    console.error('Check out error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 목록 조회
 * GET /api/v1/attendances
 */
export async function getAttendances(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, siteIds, userId, userName, status, dateFrom, dateTo } = req.query;

    const filter: attendanceService.AttendanceFilter = {};

    if (siteId) filter.siteId = siteId as string;
    if (siteIds) {
      filter.siteIds = (siteIds as string).split(',');
    }
    if (userId) filter.userId = userId as string;
    if (userName) filter.userName = userName as string;
    if (status) filter.status = status as AttendanceStatus;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);

    const attendances = await attendanceService.getAttendances(filter);

    res.json(successResponse(attendances));
  } catch (error: any) {
    console.error('Get attendances error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 상세 조회
 * GET /api/v1/attendances/:id
 */
export async function getAttendanceById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const attendance = await attendanceService.getAttendanceById(id);

    res.json(successResponse(attendance));
  } catch (error: any) {
    console.error('Get attendance by ID error:', error);
    res.status(404).json(errorResponse(error.message));
  }
}

/**
 * 오늘의 출퇴근 기록 조회
 * GET /api/v1/attendances/today
 */
export async function getTodayAttendance(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { siteId } = req.query;

    // siteId가 있으면 해당 사업장 기준, 없으면 userId만으로 조회
    const attendance = siteId
      ? await attendanceService.getTodayAttendance(userId, siteId as string)
      : await attendanceService.getTodayAttendanceByUser(userId);

    res.json(successResponse(attendance));
  } catch (error: any) {
    console.error('Get today attendance error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 통계
 * GET /api/v1/attendances/statistics
 */
export async function getAttendanceStatistics(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, dateFrom, dateTo } = req.query;

    if (!siteId || !dateFrom || !dateTo) {
      res.status(400).json(errorResponse('siteId, dateFrom, and dateTo are required'));
      return;
    }

    const stats = await attendanceService.getAttendanceStatistics(
      siteId as string,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json(successResponse(stats));
  } catch (error: any) {
    console.error('Get attendance statistics error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 사용자별 출퇴근 기록
 * GET /api/v1/attendances/user/:userId
 */
export async function getUserAttendances(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json(errorResponse('dateFrom and dateTo are required'));
      return;
    }

    const attendances = await attendanceService.getUserAttendances(
      userId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json(successResponse(attendances));
  } catch (error: any) {
    console.error('Get user attendances error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 설정 생성/수정
 * POST /api/v1/attendances/settings
 */
export async function upsertAttendanceSetting(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, expectedCheckIn, expectedCheckOut, allowedRadius } = req.body;
    const userId = req.user!.userId;

    const setting = await attendanceService.upsertAttendanceSetting(
      {
        siteId,
        expectedCheckIn,
        expectedCheckOut,
        allowedRadius: allowedRadius ? parseInt(allowedRadius) : undefined,
      },
      userId
    );

    res.json(successResponse(setting, '출퇴근 설정이 저장되었습니다.'));
  } catch (error: any) {
    console.error('Upsert attendance setting error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 설정 조회
 * GET /api/v1/attendances/settings/:siteId
 */
export async function getAttendanceSetting(req: Request, res: Response): Promise<void> {
  try {
    const { siteId } = req.params;
    const setting = await attendanceService.getAttendanceSetting(siteId);

    res.json(successResponse(setting));
  } catch (error: any) {
    console.error('Get attendance setting error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 테이블 조회 (사업장명, 성명, 평일/주말, 출근/퇴근 시간, 휴게시간)
 * GET /api/v1/attendances/table
 */
export async function getAttendanceTable(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, siteIds, userId, status, dateFrom, dateTo } = req.query;

    const filter: attendanceService.AttendanceFilter = {};

    if (siteId) filter.siteId = siteId as string;
    if (siteIds) {
      filter.siteIds = (siteIds as string).split(',');
    }
    if (userId) filter.userId = userId as string;
    if (status) filter.status = status as AttendanceStatus;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);

    const tableData = await attendanceService.getAttendanceTable(filter);

    res.json(successResponse(tableData));
  } catch (error: any) {
    console.error('Get attendance table error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 대시보드
 * GET /api/v1/attendances/dashboard
 */
export async function getDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const data = await attendanceService.getDashboardData();
    res.json(successResponse(data));
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 전체 출퇴근 설정 목록
 * GET /api/v1/attendances/settings/all
 */
export async function getAllAttendanceSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await attendanceService.getAllAttendanceSettings();
    res.json(successResponse(settings));
  } catch (error: any) {
    console.error('Get all attendance settings error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 월별 근태 리포트
 * GET /api/v1/attendances/monthly-report
 */
export async function getMonthlyReport(req: Request, res: Response): Promise<void> {
  try {
    const { month, siteId } = req.query;

    if (!month) {
      res.status(400).json(errorResponse('month parameter is required (YYYY-MM)'));
      return;
    }

    const data = await attendanceService.getMonthlyReport(
      month as string,
      siteId as string | undefined
    );

    res.json(successResponse(data));
  } catch (error: any) {
    console.error('Get monthly report error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 출퇴근 정보 수정 (휴게시간 등)
 * PUT /api/v1/attendances/:id
 */
export async function updateAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { breakStartTime, breakEndTime, note } = req.body;

    const updateData: any = {};
    if (breakStartTime !== undefined) updateData.breakStartTime = breakStartTime ? new Date(breakStartTime) : null;
    if (breakEndTime !== undefined) updateData.breakEndTime = breakEndTime ? new Date(breakEndTime) : null;
    if (note !== undefined) updateData.note = note;

    const attendance = await attendanceService.updateAttendance(id, updateData);

    res.json(successResponse(attendance, '수정되었습니다'));
  } catch (error: any) {
    console.error('Update attendance error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}
