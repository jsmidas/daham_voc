/**
 * Menu Routes
 * @description 식단 관리 라우트
 */

import { Router } from 'express';
import * as menuController from '../controllers/menu.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import {
  createMenuSchema,
  createMenuForGroupSchema,
  updateMenuSchema,
} from '../validators/menu.validator';

const router = Router();

// GET /api/v1/menus/weekly - 주간 식단 조회 (All authenticated users)
router.get('/weekly', authMiddleware, menuController.getWeeklyMenus);

// GET /api/v1/menus/monthly - 월간 식단 조회 (All authenticated users)
router.get('/monthly', authMiddleware, menuController.getMonthlyMenus);

// GET /api/v1/menus - 식단 목록 조회 (All authenticated users)
router.get('/', authMiddleware, menuController.getMenus);

// GET /api/v1/menus/:id - 식단 상세 조회 (All authenticated users)
router.get('/:id', authMiddleware, menuController.getMenuById);

// POST /api/v1/menus - 식단 생성 (Admin + STAFF)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF']),
  uploadSingle,
  validateRequest(createMenuSchema),
  menuController.createMenu
);

// POST /api/v1/menus/group/:groupId - 사업장 그룹 일괄 식단 생성 (Admin only)
router.post(
  '/group/:groupId',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  uploadSingle,
  validateRequest(createMenuForGroupSchema),
  menuController.createMenuForGroup
);

// PATCH /api/v1/menus/:id - 식단 수정 (Admin + STAFF)
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF']),
  uploadSingle,
  validateRequest(updateMenuSchema),
  menuController.updateMenu
);

// DELETE /api/v1/menus/:id - 식단 삭제 (Admin + STAFF)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF']),
  menuController.deleteMenu
);

export default router;
