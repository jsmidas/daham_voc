/**
 * Feedback Routes
 * @description 고객 피드백(VOC) 관리 라우트
 */

import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  replyFeedbackSchema,
  updateStatusSchema,
} from '../validators/feedback.validator';

const router = Router();

// GET /api/v1/feedbacks/statistics - 피드백 통계 조회 (All authenticated users)
router.get('/statistics', authMiddleware, feedbackController.getFeedbackStatistics);

// GET /api/v1/feedbacks/recent - 최근 피드백 조회 (All authenticated users)
router.get('/recent', authMiddleware, feedbackController.getRecentFeedbacks);

// GET /api/v1/feedbacks - 피드백 목록 조회 (All authenticated users)
router.get('/', authMiddleware, feedbackController.getFeedbacks);

// GET /api/v1/feedbacks/:id - 피드백 상세 조회 (All authenticated users)
router.get('/:id', authMiddleware, feedbackController.getFeedbackById);

// POST /api/v1/feedbacks - 피드백 생성 (All authenticated users)
router.post(
  '/',
  authMiddleware,
  validateRequest(createFeedbackSchema),
  feedbackController.createFeedback
);

// POST /api/v1/feedbacks/:id/reply - 관리자 답변 (Admin only)
router.post(
  '/:id/reply',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(replyFeedbackSchema),
  feedbackController.replyToFeedback
);

// PATCH /api/v1/feedbacks/:id/status - 피드백 상태 변경 (Admin only)
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(updateStatusSchema),
  feedbackController.updateFeedbackStatus
);

// PATCH /api/v1/feedbacks/:id - 피드백 수정 (Author only)
router.patch(
  '/:id',
  authMiddleware,
  validateRequest(updateFeedbackSchema),
  feedbackController.updateFeedback
);

// DELETE /api/v1/feedbacks/:id - 피드백 삭제 (Author or Admin)
router.delete(
  '/:id',
  authMiddleware,
  feedbackController.deleteFeedback
);

export default router;
