import { Router } from 'express';
import * as deliveryRouteController from '../controllers/delivery-route.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import {
  createDeliveryRouteSchema,
  updateDeliveryRouteSchema,
  addSiteToRouteSchema,
  updateRouteStopsSchema,
} from '../validators/delivery-route.validator';

const router = Router();

// 모든 라우트는 인증 필요
router.use(authMiddleware);

/**
 * GET /api/v1/delivery-routes
 * 배송 코스 목록 조회
 */
router.get('/', deliveryRouteController.getDeliveryRoutes);

/**
 * GET /api/v1/delivery-routes/my-routes
 * 내 배송 코스 조회 (배송기사용)
 */
router.get(
  '/my-routes',
  roleMiddleware(['DELIVERY_DRIVER']),
  deliveryRouteController.getMyRoutes
);

/**
 * GET /api/v1/delivery-routes/driver/:driverId
 * 특정 기사에게 배정된 코스 조회 (관리자용)
 */
router.get(
  '/driver/:driverId',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryRouteController.getDriverRoutes
);

/**
 * GET /api/v1/delivery-routes/:id
 * 배송 코스 상세 조회
 */
router.get('/:id', deliveryRouteController.getDeliveryRouteById);

/**
 * POST /api/v1/delivery-routes
 * 배송 코스 생성
 */
router.post(
  '/',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  validateRequest(createDeliveryRouteSchema),
  deliveryRouteController.createDeliveryRoute
);

/**
 * PATCH /api/v1/delivery-routes/:id
 * 배송 코스 수정
 */
router.patch(
  '/:id',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  validateRequest(updateDeliveryRouteSchema),
  deliveryRouteController.updateDeliveryRoute
);

/**
 * DELETE /api/v1/delivery-routes/:id
 * 배송 코스 삭제
 */
router.delete(
  '/:id',
  roleMiddleware(['HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryRouteController.deleteDeliveryRoute
);

/**
 * POST /api/v1/delivery-routes/:id/stops
 * 코스에 사업장 추가
 */
router.post(
  '/:id/stops',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  validateRequest(addSiteToRouteSchema),
  deliveryRouteController.addSiteToRoute
);

/**
 * DELETE /api/v1/delivery-routes/:routeId/stops/:siteId
 * 코스에서 사업장 제거
 */
router.delete(
  '/:routeId/stops/:siteId',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryRouteController.removeSiteFromRoute
);

/**
 * PUT /api/v1/delivery-routes/:id/stops/reorder
 * 코스 사업장 순서 변경
 */
router.put(
  '/:id/stops/reorder',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  validateRequest(updateRouteStopsSchema),
  deliveryRouteController.updateRouteStops
);

/**
 * POST /api/v1/delivery-routes/:id/assign-drivers
 * 기사 배정
 */
router.post(
  '/:id/assign-drivers',
  roleMiddleware(['GROUP_MANAGER', 'SITE_MANAGER', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SUPER_ADMIN']),
  deliveryRouteController.assignDrivers
);

export default router;
