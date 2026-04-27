/**
 * Notice Routes
 * @description 공지 관리 라우트
 */

import { Router } from 'express';
import * as noticeController from '../controllers/notice.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const ADMIN_ROLES = ['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER'];

router.use(authMiddleware);

// === 일반 사용자 ===
// 본인에게 보이는 공지 목록 (모바일/일반 사용자)
router.get('/', noticeController.listMine);

// 미읽음 개수 (모바일 뱃지용)
router.get('/unread-count', noticeController.unreadCount);

// 상세 (자동 읽음 처리)
router.get('/:id', noticeController.getById);

// === 관리자 전용 ===
router.get('/admin', roleMiddleware(ADMIN_ROLES), noticeController.listAdmin);
router.post('/', roleMiddleware(ADMIN_ROLES), noticeController.create);
router.patch('/:id', roleMiddleware(ADMIN_ROLES), noticeController.update);
router.delete('/:id', roleMiddleware(ADMIN_ROLES), noticeController.remove);

export default router;
