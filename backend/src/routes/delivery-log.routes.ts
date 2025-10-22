import { Router } from 'express';
import * as deliveryLogController from '../controllers/delivery-log.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 모든 라우트는 인증 필요
router.use(authMiddleware);

/**
 * GET /api/v1/delivery-logs/my-today
 * 오늘의 나의 배송 기록 조회 (기사용)
 */
router.get(
  '/my-today',
  roleMiddleware(['DELIVERY_DRIVER']),
  deliveryLogController.getMyTodayLogs
);

/**
 * GET /api/v1/delivery-logs
 * 배송 기록 목록 조회
 */
router.get('/', deliveryLogController.getDeliveryLogs);

/**
 * GET /api/v1/delivery-logs/:id
 * 배송 기록 상세 조회
 */
router.get('/:id', deliveryLogController.getDeliveryLogById);

/**
 * POST /api/v1/delivery-logs
 * 배송 기록 생성
 */
router.post(
  '/',
  roleMiddleware(['DELIVERY_DRIVER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryLogController.createDeliveryLog
);

/**
 * POST /api/v1/delivery-logs/initialize
 * 일일 배송 기록 일괄 생성
 */
router.post(
  '/initialize',
  roleMiddleware(['DELIVERY_DRIVER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryLogController.initializeDailyLogs
);

/**
 * POST /api/v1/delivery-logs/:id/check-in
 * 사업장 도착 체크인
 */
router.post(
  '/:id/check-in',
  roleMiddleware(['DELIVERY_DRIVER']),
  deliveryLogController.checkIn
);

/**
 * POST /api/v1/delivery-logs/:id/check-out
 * 사업장 출발 체크아웃
 */
router.post(
  '/:id/check-out',
  roleMiddleware(['DELIVERY_DRIVER']),
  deliveryLogController.checkOut
);

/**
 * DELETE /api/v1/delivery-logs/:id
 * 배송 기록 삭제
 */
router.delete(
  '/:id',
  roleMiddleware(['HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryLogController.deleteDeliveryLog
);

export default router;
