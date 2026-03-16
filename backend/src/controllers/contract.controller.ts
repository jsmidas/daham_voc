/**
 * Contract Controller
 * @description 전자 근로계약서 컨트롤러
 */

import { Request, Response } from 'express';
import * as contractService from '../services/contract.service';
import { uploadImage } from '../services/storage.service';

/**
 * POST /contracts - 계약서 생성 (페이지 이미지 업로드 포함)
 */
export async function createContract(req: Request, res: Response) {
  try {
    const { title, description } = req.body;
    const userId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    if (!title) {
      return res.status(400).json({ success: false, message: '계약서 제목은 필수입니다.' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '계약서 페이지 이미지를 업로드해주세요.' });
    }

    // 페이지 이미지 업로드
    const pages: { pageNumber: number; imageUrl: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const uploaded = await uploadImage(files[i], 'contracts' as any);
      pages.push({ pageNumber: i + 1, imageUrl: uploaded.originalUrl });
    }

    const contract = await contractService.createContract({
      title,
      description,
      createdBy: userId,
      pages,
    });

    return res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    console.error('계약서 생성 실패:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /contracts - 계약서 목록 조회
 */
export async function getContracts(req: Request, res: Response) {
  try {
    const { isActive, page, limit } = req.query;
    const result = await contractService.getContracts({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /contracts/:id - 계약서 상세 조회
 */
export async function getContractById(req: Request, res: Response) {
  try {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: '계약서를 찾을 수 없습니다.' });
    }
    return res.json({ success: true, data: contract });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /contracts/:id/assign - 대상자 배정
 */
export async function assignContract(req: Request, res: Response) {
  try {
    const { userIds, expiresAt } = req.body;
    const contractId = req.params.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: '배정할 사용자를 선택해주세요.' });
    }

    const result = await contractService.assignContract({
      contractId,
      userIds,
      expiresAt,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /contracts/my - 내 계약서 조회 (모바일)
 */
export async function getMyContracts(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const assignments = await contractService.getMyContracts(userId);
    return res.json({ success: true, data: assignments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /contracts/:id/sign - 서명 제출
 */
export async function signContract(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const assignmentId = req.params.id;
    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ success: false, message: '서명 이미지를 업로드해주세요.' });
    }

    // 서명 이미지 업로드
    const uploaded = await uploadImage(file, 'contracts' as any);

    const result = await contractService.signContract({
      assignmentId,
      userId,
      signatureImageUrl: uploaded.originalUrl,
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * GET /contracts/:id/status - 서명 현황 조회
 */
export async function getContractStatus(req: Request, res: Response) {
  try {
    const result = await contractService.getContractStatus(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /contracts/:id - 계약서 삭제
 */
export async function deleteContract(req: Request, res: Response) {
  try {
    await contractService.deleteContract(req.params.id);
    return res.json({ success: true, message: '계약서가 삭제되었습니다.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /contracts/assignments/:id - 배정 취소
 */
export async function removeAssignment(req: Request, res: Response) {
  try {
    await contractService.removeAssignment(req.params.id);
    return res.json({ success: true, message: '배정이 취소되었습니다.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
