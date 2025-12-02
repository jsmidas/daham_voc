/**
 * Meal Count Controller
 * @description 식수 인원 관리 컨트롤러
 */

import { Request, Response } from 'express';
import * as mealCountService from '../services/meal-count.service';

/**
 * POST /api/v1/meal-counts
 * 식수 인원 등록
 */
export async function createMealCount(req: Request, res: Response) {
  try {
    const { siteId, date, mealType, menuNumber, mealMenuId, count, note } = req.body;
    const submittedBy = req.user!.userId;

    if (!siteId || !date || !mealType || count === undefined) {
      return res.status(400).json({
        success: false,
        message: '필수 항목을 입력하세요',
      });
    }

    const mealCount = await mealCountService.createMealCount({
      siteId,
      date,
      mealType,
      menuNumber: menuNumber ? Number(menuNumber) : 1,
      mealMenuId,
      count: Number(count),
      submittedBy,
      note,
    });

    return res.status(201).json({
      success: true,
      data: mealCount,
    });
  } catch (error: any) {
    console.error('식수 인원 등록 실패:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '식수 인원 등록에 실패했습니다',
    });
  }
}

/**
 * PUT /api/v1/meal-counts/:id
 * 식수 인원 수정
 */
export async function updateMealCount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { count, note } = req.body;
    const userRole = req.user?.role;

    // 기존 레코드 조회하여 날짜 확인
    const existingRecord = await mealCountService.getMealCount(id);
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: '식수 정보를 찾을 수 없습니다',
      });
    }

    // 슈퍼관리자가 아닌 경우 과거 날짜 수정 불가
    if (userRole !== 'SUPER_ADMIN' && mealCountService.isPastDate(existingRecord.date)) {
      return res.status(403).json({
        success: false,
        message: '지난 날짜의 식수 인원은 수정할 수 없습니다',
      });
    }

    const mealCount = await mealCountService.updateMealCount(id, {
      count: count !== undefined ? Number(count) : undefined,
      note,
    });

    return res.json({
      success: true,
      data: mealCount,
    });
  } catch (error: any) {
    console.error('식수 인원 수정 실패:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '식수 인원 수정에 실패했습니다',
    });
  }
}

/**
 * DELETE /api/v1/meal-counts/:id
 * 식수 인원 삭제
 */
export async function deleteMealCount(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // 기존 레코드 조회하여 날짜 확인
    const existingRecord = await mealCountService.getMealCount(id);
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: '식수 정보를 찾을 수 없습니다',
      });
    }

    // 슈퍼관리자가 아닌 경우 과거 날짜 삭제 불가
    if (userRole !== 'SUPER_ADMIN' && mealCountService.isPastDate(existingRecord.date)) {
      return res.status(403).json({
        success: false,
        message: '지난 날짜의 식수 인원은 삭제할 수 없습니다',
      });
    }

    await mealCountService.deleteMealCount(id);

    return res.json({
      success: true,
      message: '삭제되었습니다',
    });
  } catch (error: any) {
    console.error('식수 인원 삭제 실패:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '식수 인원 삭제에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-counts/:id
 * 식수 인원 조회 (단일)
 */
export async function getMealCount(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const mealCount = await mealCountService.getMealCount(id);

    if (!mealCount) {
      return res.status(404).json({
        success: false,
        message: '식수 정보를 찾을 수 없습니다',
      });
    }

    return res.json({
      success: true,
      data: mealCount,
    });
  } catch (error: any) {
    console.error('식수 인원 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '식수 인원 조회에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-counts/site/:siteId/date/:date
 * 사업장 날짜별 식수 인원 조회
 */
export async function getMealCountsByDate(req: Request, res: Response) {
  try {
    const { siteId, date } = req.params;

    const mealCounts = await mealCountService.getMealCountsByDate(siteId, date);

    return res.json({
      success: true,
      data: mealCounts,
    });
  } catch (error: any) {
    console.error('식수 인원 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '식수 인원 조회에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-counts/site/:siteId/range
 * 사업장 기간별 식수 인원 조회
 * Query params: startDate, endDate
 */
export async function getMealCountsByRange(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate와 endDate를 입력하세요',
      });
    }

    const mealCounts = await mealCountService.getMealCountsByRange(
      siteId,
      startDate as string,
      endDate as string
    );

    return res.json({
      success: true,
      data: mealCounts,
    });
  } catch (error: any) {
    console.error('식수 인원 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '식수 인원 조회에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-counts/all/range
 * 전체 사업장 기간별 식수 인원 조회
 * Query params: startDate, endDate
 */
export async function getAllMealCountsByRange(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate와 endDate를 입력하세요',
      });
    }

    const mealCounts = await mealCountService.getAllMealCountsByRange(
      startDate as string,
      endDate as string
    );

    return res.json({
      success: true,
      data: mealCounts,
    });
  } catch (error: any) {
    console.error('전체 사업장 식수 인원 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '전체 사업장 식수 인원 조회에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-counts/settings/all
 * 전체 사업장 식수 설정 조회
 */
export async function getAllMealCountSettings(_req: Request, res: Response) {
  try {
    const settings = await mealCountService.getAllMealCountSettings();

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('전체 식수 설정 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '전체 식수 설정 조회에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-counts/settings/:siteId
 * 사업장 식수 설정 조회
 */
export async function getMealCountSetting(req: Request, res: Response) {
  try {
    const { siteId } = req.params;

    const setting = await mealCountService.getMealCountSetting(siteId);

    return res.json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    console.error('식수 설정 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '식수 설정 조회에 실패했습니다',
    });
  }
}

/**
 * POST /api/v1/meal-counts/settings/:siteId
 * 사업장 식수 설정 생성/수정
 */
export async function upsertMealCountSetting(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const data = req.body;

    const setting = await mealCountService.upsertMealCountSetting(siteId, data);

    return res.json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    console.error('식수 설정 저장 실패:', error);
    return res.status(500).json({
      success: false,
      message: '식수 설정 저장에 실패했습니다',
    });
  }
}
