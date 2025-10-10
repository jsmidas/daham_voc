/**
 * Attendance Routes
 * @description 출퇴근 관리 라우트
 */

import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import {
  checkInSchema,
  checkOutSchema,
  attendanceSettingSchema,
} from '../validators/attendance.validator';

const router = Router();

// GET /api/v1/attendances/statistics - 출퇴근 통계 조회 (Admin only)
router.get(
  '/statistics',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  attendanceController.getAttendanceStatistics
);

// GET /api/v1/attendances/today - 오늘의 출퇴근 기록 조회 (All authenticated users)
router.get('/today', authMiddleware, attendanceController.getTodayAttendance);

// GET /api/v1/attendances/user/:userId - 사용자별 출퇴근 기록 조회 (Admin or self)
router.get(
  '/user/:userId',
  authMiddleware,
  attendanceController.getUserAttendances
);

// GET /api/v1/attendances/settings/:siteId - 출퇴근 설정 조회 (All authenticated users)
router.get(
  '/settings/:siteId',
  authMiddleware,
  attendanceController.getAttendanceSetting
);

// GET /api/v1/attendances/:id - 출퇴근 상세 조회 (All authenticated users)
router.get('/:id', authMiddleware, attendanceController.getAttendanceById);

// GET /api/v1/attendances - 출퇴근 목록 조회 (All authenticated users)
router.get('/', authMiddleware, attendanceController.getAttendances);

// POST /api/v1/attendances/check-in - 체크인 (All authenticated users)
router.post(
  '/check-in',
  authMiddleware,
  validateRequest(checkInSchema),
  attendanceController.checkIn
);

// POST /api/v1/attendances/:id/check-out - 체크아웃 (All authenticated users)
router.post(
  '/:id/check-out',
  authMiddleware,
  validateRequest(checkOutSchema),
  attendanceController.checkOut
);

// POST /api/v1/attendances/settings - 출퇴근 설정 생성/수정 (Admin only)
router.post(
  '/settings',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(attendanceSettingSchema),
  attendanceController.upsertAttendanceSetting
);

export default router;
