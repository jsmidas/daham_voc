import { Router } from 'express';
import * as controller from '../controllers/delivery-schedule.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// 오늘의 배정 (기사용) - 가장 먼저 매칭
router.get('/today', controller.getTodayAssignments);

// 특정 날짜 배정 (관리자용)
router.get(
  '/date/:date',
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.getAssignmentsForDate
);

// 오버라이드 CRUD (관리자)
router.get('/overrides', controller.getOverrides);
router.post(
  '/overrides',
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.upsertOverride
);
router.delete(
  '/overrides/:id',
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.deleteOverride
);

// 기본 스케줄 CRUD
router.get('/', controller.getSchedules);
router.post(
  '/',
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.upsertSchedule
);
router.post(
  '/bulk',
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.bulkUpsertSchedules
);
router.delete(
  '/:id',
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.deleteSchedule
);

export default router;
