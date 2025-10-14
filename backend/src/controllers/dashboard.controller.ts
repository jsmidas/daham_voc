/**
 * Dashboard Controller
 * @description 대시보드 통계 API 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

/**
 * GET /api/v1/dashboard/summary
 * @description 대시보드 요약 통계 조회
 */
export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'dateFrom and dateTo are required',
        },
      });
      return;
    }

    const summary = await dashboardService.getDashboardSummary(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard/daily-voc-trend
 * @description 일별 VOC 트렌드 조회
 */
export async function getDailyVOCTrend(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'dateFrom and dateTo are required',
        },
      });
      return;
    }

    const trend = await dashboardService.getDailyVOCTrend(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard/site-comparison
 * @description 사업장별 비교 통계 조회
 */
export async function getSiteComparison(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'dateFrom and dateTo are required',
        },
      });
      return;
    }

    const comparison = await dashboardService.getSiteComparison(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard/staff-performance
 * @description 담당자별 평점 통계 조회
 */
export async function getStaffPerformance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'dateFrom and dateTo are required',
        },
      });
      return;
    }

    const performance = await dashboardService.getStaffPerformance(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
}
