/**
 * Contract Routes
 * @description 전자 근로계약서 라우트
 */

import { Router } from 'express';
import * as contractController from '../controllers/contract.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { uploadContractPages, uploadSignature } from '../middlewares/upload.middleware';

const router = Router();

// GET /api/v1/contracts/my - 내 계약서 조회 (모바일 - 모든 인증된 사용자)
router.get('/my', authMiddleware, contractController.getMyContracts);

// GET /api/v1/contracts/targets - 계약 대상자 목록 조회 (관리자)
router.get(
  '/targets',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.getContractTargets
);

// POST /api/v1/contracts/assign-bulk - 여러 계약서 일괄 배정 (관리자)
router.post(
  '/assign-bulk',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.assignMultipleContracts
);

// GET /api/v1/contracts - 계약서 목록 조회 (관리자)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.getContracts
);

// GET /api/v1/contracts/:id - 계약서 상세 조회 (관리자)
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.getContractById
);

// POST /api/v1/contracts - 계약서 생성 (관리자)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  uploadContractPages,
  contractController.createContract
);

// PATCH /api/v1/contracts/:id/sign-zone - 서명 영역 설정 (관리자)
router.patch(
  '/:id/sign-zone',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  contractController.updateSignZone
);

// POST /api/v1/contracts/:id/assign - 대상자 배정 (관리자)
router.post(
  '/:id/assign',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.assignContract
);

// POST /api/v1/contracts/:id/sign - 서명 제출 (모든 인증된 사용자)
router.post(
  '/:id/sign',
  authMiddleware,
  uploadSignature,
  contractController.signContract
);

// GET /api/v1/contracts/:id/status - 서명 현황 조회 (관리자)
router.get(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.getContractStatus
);

// DELETE /api/v1/contracts/:id - 계약서 삭제 (관리자)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  contractController.deleteContract
);

// DELETE /api/v1/contracts/assignments/:id - 배정 취소 (관리자)
router.delete(
  '/assignments/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN', 'GROUP_MANAGER']),
  contractController.removeAssignment
);

export default router;
