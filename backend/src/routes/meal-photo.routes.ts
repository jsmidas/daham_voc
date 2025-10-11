/**
 * MealPhoto Routes
 * @description 식사 사진 관리 라우트
 */

import { Router } from 'express';
import * as mealPhotoController from '../controllers/meal-photo.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import { uploadSingle, uploadMealPhotos } from '../middlewares/upload.middleware';
import {
  createMealPhotoSchema,
  updateMealPhotoSchema,
} from '../validators/meal-photo.validator';

const router = Router();

// GET /api/v1/meal-photos/statistics - 사진 통계 조회 (All authenticated users)
router.get('/statistics', authMiddleware, mealPhotoController.getPhotoStatistics);

// GET /api/v1/meal-photos/daily - 일간 사진 조회 (All authenticated users)
router.get('/daily', authMiddleware, mealPhotoController.getDailyPhotos);

// GET /api/v1/meal-photos/weekly - 주간 사진 조회 (All authenticated users)
router.get('/weekly', authMiddleware, mealPhotoController.getWeeklyPhotos);

// GET /api/v1/meal-photos/monthly - 월간 사진 조회 (All authenticated users)
router.get('/monthly', authMiddleware, mealPhotoController.getMonthlyPhotos);

// GET /api/v1/meal-photos - 식사 사진 목록 조회 (All authenticated users)
router.get('/', authMiddleware, mealPhotoController.getMealPhotos);

// GET /api/v1/meal-photos/:id - 식사 사진 상세 조회 (All authenticated users)
router.get('/:id', authMiddleware, mealPhotoController.getMealPhotoById);

// POST /api/v1/meal-photos/bulk - 식사 사진 일괄 업로드 (Admin + STAFF, 최대 6개)
router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'SITE_STAFF', 'DELIVERY_DRIVER']),
  uploadMealPhotos,
  mealPhotoController.bulkCreateMealPhotos
);

// POST /api/v1/meal-photos - 식사 사진 생성 (Admin + STAFF)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF']),
  uploadSingle,
  validateRequest(createMealPhotoSchema),
  mealPhotoController.createMealPhoto
);

// PATCH /api/v1/meal-photos/:id - 식사 사진 수정 (Admin + STAFF)
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF']),
  uploadSingle,
  validateRequest(updateMealPhotoSchema),
  mealPhotoController.updateMealPhoto
);

// DELETE /api/v1/meal-photos/:id - 식사 사진 삭제 (Admin + STAFF)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'STAFF']),
  mealPhotoController.deleteMealPhoto
);

export default router;
