/**
 * Meal Menu Controller
 * @description 식수 메뉴 관리 컨트롤러
 */

import { Request, Response } from 'express';
import * as mealMenuService from '../services/meal-menu.service';

/**
 * GET /api/v1/meal-menus
 * 전체 메뉴 목록 조회
 */
export async function getMealMenus(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const menus = await mealMenuService.getMealMenus(includeInactive);

    return res.json({
      success: true,
      data: menus,
    });
  } catch (error: any) {
    console.error('메뉴 목록 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '메뉴 목록 조회에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-menus/:id
 * 메뉴 단일 조회
 */
export async function getMealMenuById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const menu = await mealMenuService.getMealMenuById(id);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: '메뉴를 찾을 수 없습니다',
      });
    }

    return res.json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    console.error('메뉴 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '메뉴 조회에 실패했습니다',
    });
  }
}

/**
 * POST /api/v1/meal-menus
 * 메뉴 생성
 */
export async function createMealMenu(req: Request, res: Response) {
  try {
    const { name, description, sortOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '메뉴 이름을 입력하세요',
      });
    }

    const menu = await mealMenuService.createMealMenu({
      name,
      description,
      sortOrder,
      isActive,
    });

    return res.status(201).json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    console.error('메뉴 생성 실패:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 메뉴 이름입니다',
      });
    }
    return res.status(500).json({
      success: false,
      message: '메뉴 생성에 실패했습니다',
    });
  }
}

/**
 * PUT /api/v1/meal-menus/:id
 * 메뉴 수정
 */
export async function updateMealMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;

    const menu = await mealMenuService.updateMealMenu(id, {
      name,
      description,
      sortOrder,
      isActive,
    });

    return res.json({
      success: true,
      data: menu,
    });
  } catch (error: any) {
    console.error('메뉴 수정 실패:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 메뉴 이름입니다',
      });
    }
    return res.status(500).json({
      success: false,
      message: '메뉴 수정에 실패했습니다',
    });
  }
}

/**
 * DELETE /api/v1/meal-menus/:id
 * 메뉴 삭제
 */
export async function deleteMealMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await mealMenuService.deleteMealMenu(id);

    return res.json({
      success: true,
      message: '메뉴가 삭제되었습니다',
    });
  } catch (error: any) {
    console.error('메뉴 삭제 실패:', error);
    return res.status(500).json({
      success: false,
      message: '메뉴 삭제에 실패했습니다',
    });
  }
}

/**
 * GET /api/v1/meal-menus/site/:siteId
 * 사업장에 할당된 메뉴 목록 조회
 */
export async function getSiteMealMenus(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const menus = await mealMenuService.getSiteMealMenus(siteId);

    return res.json({
      success: true,
      data: menus,
    });
  } catch (error: any) {
    console.error('사업장 메뉴 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '사업장 메뉴 조회에 실패했습니다',
    });
  }
}

/**
 * POST /api/v1/meal-menus/site/:siteId
 * 사업장에 메뉴 할당
 */
export async function assignMealMenusToSite(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { mealMenuIds } = req.body;

    if (!Array.isArray(mealMenuIds)) {
      return res.status(400).json({
        success: false,
        message: 'mealMenuIds는 배열이어야 합니다',
      });
    }

    const menus = await mealMenuService.assignMealMenusToSite(siteId, mealMenuIds);

    return res.json({
      success: true,
      data: menus,
    });
  } catch (error: any) {
    console.error('사업장 메뉴 할당 실패:', error);
    return res.status(500).json({
      success: false,
      message: '사업장 메뉴 할당에 실패했습니다',
    });
  }
}
