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

/**
 * GET /api/v1/dashboard/daily-voc-trend
 * @description 일별 VOC 트렌드
 * @access Private (모든 인증된 사용자)
 */
router.get('/daily-voc-trend', dashboardController.getDailyVOCTrend);

/**
 * GET /api/v1/dashboard/site-comparison
 * @description 사업장별 비교 통계
 * @access Private (모든 인증된 사용자)
 */
router.get('/site-comparison', dashboardController.getSiteComparison);

/**
 * GET /api/v1/dashboard/staff-performance
 * @description 담당자별 평점 통계
 * @access Private (모든 인증된 사용자)
 */
router.get('/staff-performance', dashboardController.getStaffPerformance);

export default router;
