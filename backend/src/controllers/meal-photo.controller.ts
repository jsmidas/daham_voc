/**
 * MealPhoto Controller
 * @description 식사 사진 관리 API 엔드포인트
 */

import { Request, Response } from 'express';
import * as mealPhotoService from '../services/meal-photo.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { MealType, PhotoType } from '@prisma/client';

/**
 * 식사 사진 생성
 * POST /api/v1/meal-photos
 */
export async function createMealPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, mealType, photoType, capturedAt, latitude, longitude } = req.body;
    const userId = req.user!.userId;
    const image = req.file;

    if (!image) {
      res.status(400).json(errorResponse('이미지 파일이 필요합니다'));
      return;
    }

    const photo = await mealPhotoService.createMealPhoto(
      {
        siteId,
        mealType: mealType ? (mealType as MealType) : undefined,
        photoType: photoType as PhotoType,
        capturedAt: new Date(capturedAt),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        image,
      },
      userId
    );

    res.status(201).json(successResponse(photo, '식사 사진이 업로드되었습니다.'));
  } catch (error: any) {
    console.error('Create meal photo error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 식사 사진 목록 조회
 * GET /api/v1/meal-photos
 */
export async function getMealPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, siteIds, uploaderId, photoType, mealType, dateFrom, dateTo } = req.query;

    const filter: mealPhotoService.MealPhotoFilter = {};

    if (siteId) filter.siteId = siteId as string;
    if (siteIds) {
      filter.siteIds = (siteIds as string).split(',');
    }
    if (uploaderId) filter.uploaderId = uploaderId as string;
    if (photoType) filter.photoType = photoType as PhotoType;
    if (mealType) filter.mealType = mealType as MealType;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);

    const photos = await mealPhotoService.getMealPhotos(filter);

    res.json(successResponse(photos));
  } catch (error: any) {
    console.error('Get meal photos error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 식사 사진 상세 조회
 * GET /api/v1/meal-photos/:id
 */
export async function getMealPhotoById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const photo = await mealPhotoService.getMealPhotoById(id);

    res.json(successResponse(photo));
  } catch (error: any) {
    console.error('Get meal photo by ID error:', error);
    res.status(404).json(errorResponse(error.message));
  }
}

/**
 * 식사 사진 수정
 * PATCH /api/v1/meal-photos/:id
 */
export async function updateMealPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { mealType, photoType, capturedAt, feedback } = req.body;
    const userId = req.user!.userId;
    const image = req.file;

    const updateDto: mealPhotoService.UpdateMealPhotoDto = {};

    if (mealType) updateDto.mealType = mealType as MealType;
    if (photoType) updateDto.photoType = photoType as PhotoType;
    if (capturedAt) updateDto.capturedAt = new Date(capturedAt);
    if (feedback !== undefined) updateDto.feedback = feedback;
    if (image) updateDto.image = image;

    const photo = await mealPhotoService.updateMealPhoto(id, updateDto, userId);

    res.json(successResponse(photo, '식사 사진이 수정되었습니다.'));
  } catch (error: any) {
    console.error('Update meal photo error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 식사 사진 삭제
 * DELETE /api/v1/meal-photos/:id
 */
export async function deleteMealPhoto(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await mealPhotoService.deleteMealPhoto(id, userId);

    res.json(successResponse(null, '식사 사진이 삭제되었습니다.'));
  } catch (error: any) {
    console.error('Delete meal photo error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 일간 사진 조회
 * GET /api/v1/meal-photos/daily
 */
export async function getDailyPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, date } = req.query;

    if (!siteId || !date) {
      res.status(400).json(errorResponse('siteId and date are required'));
      return;
    }

    const photos = await mealPhotoService.getDailyPhotos(
      siteId as string,
      new Date(date as string)
    );

    res.json(successResponse(photos));
  } catch (error: any) {
    console.error('Get daily photos error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 주간 사진 조회
 * GET /api/v1/meal-photos/weekly
 */
export async function getWeeklyPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, weekStart } = req.query;

    if (!siteId || !weekStart) {
      res.status(400).json(errorResponse('siteId and weekStart are required'));
      return;
    }

    const photos = await mealPhotoService.getWeeklyPhotos(
      siteId as string,
      new Date(weekStart as string)
    );

    res.json(successResponse(photos));
  } catch (error: any) {
    console.error('Get weekly photos error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 월간 사진 조회
 * GET /api/v1/meal-photos/monthly
 */
export async function getMonthlyPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, year, month } = req.query;

    if (!siteId || !year || !month) {
      res.status(400).json(errorResponse('siteId, year, and month are required'));
      return;
    }

    const photos = await mealPhotoService.getMonthlyPhotos(
      siteId as string,
      parseInt(year as string),
      parseInt(month as string)
    );

    res.json(successResponse(photos));
  } catch (error: any) {
    console.error('Get monthly photos error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 사진 통계 조회
 * GET /api/v1/meal-photos/statistics
 */
export async function getPhotoStatistics(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, dateFrom, dateTo } = req.query;

    if (!siteId || !dateFrom || !dateTo) {
      res.status(400).json(errorResponse('siteId, dateFrom, and dateTo are required'));
      return;
    }

    const stats = await mealPhotoService.getPhotoStatistics(
      siteId as string,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json(successResponse(stats));
  } catch (error: any) {
    console.error('Get photo statistics error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}
