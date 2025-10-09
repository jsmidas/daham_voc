/**
 * Menu Controller
 * @description 식단 관리 API 엔드포인트
 */

import { Request, Response } from 'express';
import * as menuService from '../services/menu.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { MealType } from '@prisma/client';

/**
 * 식단 생성
 * POST /api/v1/menus
 */
export async function createMenu(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, startDate, endDate, mealType, menuItems } = req.body;
    const userId = req.user!.userId;
    const image = req.file;

    const menu = await menuService.createMenu(
      {
        siteId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        mealType: mealType as MealType,
        menuItems,
        image,
      },
      userId
    );

    res.status(201).json(successResponse(menu, '식단이 생성되었습니다.'));
  } catch (error: any) {
    console.error('Create menu error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 사업장 그룹 일괄 식단 생성
 * POST /api/v1/menus/group/:groupId
 */
export async function createMenuForGroup(req: Request, res: Response): Promise<void> {
  try {
    const { groupId } = req.params;
    const { startDate, endDate, mealType, menuItems } = req.body;
    const userId = req.user!.userId;
    const image = req.file;

    const result = await menuService.createMenuForGroup(
      groupId,
      new Date(startDate),
      new Date(endDate),
      mealType as MealType,
      menuItems,
      image,
      userId
    );

    res.status(201).json(
      successResponse(
        result,
        `식단이 생성되었습니다. (성공: ${result.created.length}, 실패: ${result.failed.length})`
      )
    );
  } catch (error: any) {
    console.error('Create menu for group error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 식단 목록 조회
 * GET /api/v1/menus
 */
export async function getMenus(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, siteIds, dateFrom, dateTo, mealType } = req.query;

    const filter: menuService.MenuFilter = {};

    if (siteId) filter.siteId = siteId as string;
    if (siteIds) {
      filter.siteIds = (siteIds as string).split(',');
    }
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    if (mealType) filter.mealType = mealType as MealType;

    const menus = await menuService.getMenus(filter);

    res.json(successResponse(menus));
  } catch (error: any) {
    console.error('Get menus error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 식단 상세 조회
 * GET /api/v1/menus/:id
 */
export async function getMenuById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const menu = await menuService.getMenuById(id);

    res.json(successResponse(menu));
  } catch (error: any) {
    console.error('Get menu by ID error:', error);
    res.status(404).json(errorResponse(error.message));
  }
}

/**
 * 식단 수정
 * PATCH /api/v1/menus/:id
 */
export async function updateMenu(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { startDate, endDate, mealType, menuItems, deleteImage } = req.body;
    const userId = req.user!.userId;
    const image = req.file;

    const updateDto: menuService.UpdateMenuDto = {};

    if (startDate) updateDto.startDate = new Date(startDate);
    if (endDate) updateDto.endDate = new Date(endDate);
    if (mealType) updateDto.mealType = mealType as MealType;
    if (menuItems !== undefined) updateDto.menuItems = menuItems;
    if (image) updateDto.image = image;
    if (deleteImage === 'true' || deleteImage === true) updateDto.deleteImage = true;

    const menu = await menuService.updateMenu(id, updateDto, userId);

    res.json(successResponse(menu, '식단이 수정되었습니다.'));
  } catch (error: any) {
    console.error('Update menu error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 식단 삭제
 * DELETE /api/v1/menus/:id
 */
export async function deleteMenu(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await menuService.deleteMenu(id, userId);

    res.json(successResponse(null, '식단이 삭제되었습니다.'));
  } catch (error: any) {
    console.error('Delete menu error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 주간 식단 조회
 * GET /api/v1/menus/weekly
 */
export async function getWeeklyMenus(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, weekStart } = req.query;

    if (!siteId || !weekStart) {
      res.status(400).json(errorResponse('siteId and weekStart are required'));
      return;
    }

    const menus = await menuService.getWeeklyMenus(
      siteId as string,
      new Date(weekStart as string)
    );

    res.json(successResponse(menus));
  } catch (error: any) {
    console.error('Get weekly menus error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 월간 식단 조회
 * GET /api/v1/menus/monthly
 */
export async function getMonthlyMenus(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, year, month } = req.query;

    if (!siteId || !year || !month) {
      res.status(400).json(errorResponse('siteId, year, and month are required'));
      return;
    }

    const menus = await menuService.getMonthlyMenus(
      siteId as string,
      parseInt(year as string),
      parseInt(month as string)
    );

    res.json(successResponse(menus));
  } catch (error: any) {
    console.error('Get monthly menus error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}
