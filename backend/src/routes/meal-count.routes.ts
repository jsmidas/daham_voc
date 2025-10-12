/**
 * Meal Count Routes
 * @description 식수 인원 관리 라우트
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as mealCountController from '../controllers/meal-count.controller';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// 식수 인원 CRUD
router.post('/', mealCountController.createMealCount);
router.put('/:id', mealCountController.updateMealCount);
router.delete('/:id', mealCountController.deleteMealCount);
router.get('/:id', mealCountController.getMealCount);

// 사업장별 식수 조회
router.get('/site/:siteId/date/:date', mealCountController.getMealCountsByDate);
router.get('/site/:siteId/range', mealCountController.getMealCountsByRange);

// 식수 설정
router.get('/settings/:siteId', mealCountController.getMealCountSetting);
router.post('/settings/:siteId', mealCountController.upsertMealCountSetting);

export default router;
