/**
 * Staff Routes
 * @description 담당자 관리 라우트
 */

import { Router } from 'express';
import * as staffController from '../controllers/staff.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 담당자 목록 조회
router.get('/', staffController.getStaffList);

// 담당자 상세 조회
router.get('/:id', staffController.getStaffById);

// 담당자 생성
router.post('/', staffController.createStaff);

// 담당자 수정
router.patch('/:id', staffController.updateStaff);

// 담당자 삭제
router.delete('/:id', staffController.deleteStaff);

// 담당자 사업장 배정
router.post('/:id/sites', staffController.assignStaffToSites);

// 비밀번호 초기화
router.post('/:id/reset-password', staffController.resetStaffPassword);

export default router;
