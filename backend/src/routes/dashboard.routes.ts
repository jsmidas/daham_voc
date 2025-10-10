/**
 * Dashboard Routes
 * @description 대시보드 통계 라우트
 */

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authMiddleware);

/**
 * GET /api/v1/dashboard/summary
 * @description 대시보드 요약 통계
 * @access Private (모든 인증된 사용자)
 */
router.get('/summary', dashboardController.getSummary);

export default router;
