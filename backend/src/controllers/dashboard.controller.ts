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
