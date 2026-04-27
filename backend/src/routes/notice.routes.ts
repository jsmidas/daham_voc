/**
 * Notice Routes
 * @description 공지 관리 라우트
 */

import { Router } from 'express';
import * as noticeController from '../controllers/notice.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// 본인에게 보이는 공지 목록 (모바일/일반 사용자)
router.get('/', noticeController.listMine);

// 관리자용 전체 목록
router.get('/admin', noticeController.listAdmin);

// 미읽음 개수 (모바일 뱃지용)
router.get('/unread-count', noticeController.unreadCount);

// 상세 (자동 읽음 처리)
router.get('/:id', noticeController.getById);

// 작성/수정/삭제 (관리자)
router.post('/', noticeController.create);
router.patch('/:id', noticeController.update);
router.delete('/:id', noticeController.remove);

export default router;
