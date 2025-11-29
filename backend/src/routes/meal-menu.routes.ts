/**
 * Meal Menu Routes
 * @description 식수 메뉴 관리 라우트
 */

import { Router } from 'express';
import * as mealMenuController from '../controllers/meal-menu.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 전체 메뉴 목록 조회
router.get('/', mealMenuController.getMealMenus);

// 사업장별 메뉴 조회 (site 라우트가 :id 보다 먼저 와야 함)
router.get('/site/:siteId', mealMenuController.getSiteMealMenus);

// 사업장에 메뉴 할당
router.post('/site/:siteId', mealMenuController.assignMealMenusToSite);

// 메뉴 단일 조회
router.get('/:id', mealMenuController.getMealMenuById);

// 메뉴 생성
router.post('/', mealMenuController.createMealMenu);

// 메뉴 수정
router.put('/:id', mealMenuController.updateMealMenu);

// 메뉴 삭제
router.delete('/:id', mealMenuController.deleteMealMenu);

export default router;
