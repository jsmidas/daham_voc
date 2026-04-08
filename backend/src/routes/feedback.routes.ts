/**
 * Feedback Routes
 * @description 고객 피드백(VOC) 관리 라우트
 */

import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import { uploadFeedbackImages } from '../middlewares/upload.middleware';
import {
  replyFeedbackSchema,
  updateStatusSchema,
  updateFeedbackSchema,
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

// POST /api/v1/feedbacks - 피드백 생성 (All authenticated users, 이미지 업로드 지원 최대 6개)
router.post(
  '/',
  authMiddleware,
  uploadFeedbackImages,  // multipart/form-data 처리, 최대 6개 이미지
  feedbackController.createFeedback
);

// POST /api/v1/feedbacks/:id/reply - 관리자 답변 (기존 호환용, Admin only)
router.post(
  '/:id/reply',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(replyFeedbackSchema),
  feedbackController.replyToFeedback
);

// POST /api/v1/feedbacks/:id/replies - 다중 답변 추가 (관리자 + 담당자)
router.post(
  '/:id/replies',
  authMiddleware,
  feedbackController.addReply
);

// DELETE /api/v1/feedbacks/replies/:replyId - 답변 삭제 (작성자 또는 관리자)
router.delete(
  '/replies/:replyId',
  authMiddleware,
  feedbackController.deleteReply
);

// PATCH /api/v1/feedbacks/:id/status - 피드백 상태 변경 (관리자 + 담당자)
router.patch(
  '/:id/status',
  authMiddleware,
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
