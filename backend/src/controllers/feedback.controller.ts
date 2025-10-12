/**
 * Feedback Controller
 * @description 고객 피드백(VOC) 관리 API 엔드포인트
 */

import { Request, Response } from 'express';
import * as feedbackService from '../services/feedback.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { FeedbackAuthorType, FeedbackStatus } from '@prisma/client';

/**
 * 피드백 생성
 * POST /api/v1/feedbacks
 * @description multipart/form-data 지원 (이미지 업로드 포함, 최대 6개)
 */
export async function createFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, authorType, content, rating, feedbackDate, mealType } = req.body;
    const userId = req.user!.userId;

    // 업로드된 파일들 (multer가 req.files에 저장)
    const imageFiles = req.files as Express.Multer.File[];

    const feedback = await feedbackService.createFeedback(
      {
        siteId,
        authorType: authorType as FeedbackAuthorType,
        content,
        rating: rating ? parseInt(rating) : undefined,
        feedbackDate: feedbackDate ? new Date(feedbackDate) : undefined,
        mealType: mealType || undefined,
        imageFiles: imageFiles || [],
      },
      userId
    );

    res.status(201).json(successResponse(feedback, '피드백이 생성되었습니다.'));
  } catch (error: any) {
    console.error('Create feedback error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 피드백 목록 조회
 * GET /api/v1/feedbacks
 */
export async function getFeedbacks(req: Request, res: Response): Promise<void> {
  try {
    const {
      siteId,
      siteIds,
      authorId,
      authorType,
      status,
      dateFrom,
      dateTo,
      minRating,
      maxRating,
    } = req.query;

    const filter: feedbackService.FeedbackFilter = {};

    if (siteId) filter.siteId = siteId as string;
    if (siteIds) {
      filter.siteIds = (siteIds as string).split(',');
    }
    if (authorId) filter.authorId = authorId as string;
    if (authorType) filter.authorType = authorType as FeedbackAuthorType;
    if (status) filter.status = status as FeedbackStatus;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    if (minRating) filter.minRating = parseInt(minRating as string);
    if (maxRating) filter.maxRating = parseInt(maxRating as string);

    const feedbacks = await feedbackService.getFeedbacks(filter);

    res.json(successResponse(feedbacks));
  } catch (error: any) {
    console.error('Get feedbacks error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 피드백 상세 조회
 * GET /api/v1/feedbacks/:id
 */
export async function getFeedbackById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const feedback = await feedbackService.getFeedbackById(id);

    res.json(successResponse(feedback));
  } catch (error: any) {
    console.error('Get feedback by ID error:', error);
    res.status(404).json(errorResponse(error.message));
  }
}

/**
 * 피드백 수정
 * PATCH /api/v1/feedbacks/:id
 */
export async function updateFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { content, rating, status } = req.body;
    const userId = req.user!.userId;

    const updateDto: feedbackService.UpdateFeedbackDto = {};

    if (content !== undefined) updateDto.content = content;
    if (rating !== undefined) updateDto.rating = parseInt(rating);
    if (status) updateDto.status = status as FeedbackStatus;

    const feedback = await feedbackService.updateFeedback(id, updateDto, userId);

    res.json(successResponse(feedback, '피드백이 수정되었습니다.'));
  } catch (error: any) {
    console.error('Update feedback error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 피드백 삭제
 * DELETE /api/v1/feedbacks/:id
 */
export async function deleteFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await feedbackService.deleteFeedback(id, userId);

    res.json(successResponse(null, '피드백이 삭제되었습니다.'));
  } catch (error: any) {
    console.error('Delete feedback error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 관리자 답변
 * POST /api/v1/feedbacks/:id/reply
 */
export async function replyToFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;
    const userId = req.user!.userId;

    const feedback = await feedbackService.replyToFeedback(
      id,
      { adminReply },
      userId
    );

    res.json(successResponse(feedback, '답변이 등록되었습니다.'));
  } catch (error: any) {
    console.error('Reply to feedback error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 피드백 상태 변경
 * PATCH /api/v1/feedbacks/:id/status
 */
export async function updateFeedbackStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;

    if (!status) {
      res.status(400).json(errorResponse('Status is required'));
      return;
    }

    const feedback = await feedbackService.updateFeedbackStatus(
      id,
      status as FeedbackStatus,
      userId
    );

    res.json(successResponse(feedback, '피드백 상태가 변경되었습니다.'));
  } catch (error: any) {
    console.error('Update feedback status error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 피드백 통계
 * GET /api/v1/feedbacks/statistics
 */
export async function getFeedbackStatistics(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, dateFrom, dateTo } = req.query;

    if (!siteId || !dateFrom || !dateTo) {
      res.status(400).json(errorResponse('siteId, dateFrom, and dateTo are required'));
      return;
    }

    const stats = await feedbackService.getFeedbackStatistics(
      siteId as string,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    res.json(successResponse(stats));
  } catch (error: any) {
    console.error('Get feedback statistics error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}

/**
 * 최근 피드백 조회
 * GET /api/v1/feedbacks/recent
 */
export async function getRecentFeedbacks(req: Request, res: Response): Promise<void> {
  try {
    const { siteId, limit } = req.query;

    if (!siteId) {
      res.status(400).json(errorResponse('siteId is required'));
      return;
    }

    const feedbacks = await feedbackService.getRecentFeedbacks(
      siteId as string,
      limit ? parseInt(limit as string) : 10
    );

    res.json(successResponse(feedbacks));
  } catch (error: any) {
    console.error('Get recent feedbacks error:', error);
    res.status(400).json(errorResponse(error.message));
  }
}
