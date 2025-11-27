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

// 전체 사업장 조회 (가장 구체적인 경로 먼저)
router.get('/all/range', mealCountController.getAllMealCountsByRange);

// 식수 설정 (구체적인 경로 먼저)
router.get('/settings/all', mealCountController.getAllMealCountSettings);
router.get('/settings/:siteId', mealCountController.getMealCountSetting);
router.post('/settings/:siteId', mealCountController.upsertMealCountSetting);

// 사업장별 식수 조회 (구체적인 경로 먼저)
router.get('/site/:siteId/date/:date', mealCountController.getMealCountsByDate);
router.get('/site/:siteId/range', mealCountController.getMealCountsByRange);

// 식수 인원 CRUD (일반 파라미터 경로는 마지막에)
router.post('/', mealCountController.createMealCount);
router.put('/:id', mealCountController.updateMealCount);
router.delete('/:id', mealCountController.deleteMealCount);
router.get('/:id', mealCountController.getMealCount);

export default router;
