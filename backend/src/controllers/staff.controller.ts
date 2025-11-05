/**
 * Staff Controller
 * @description 담당자 관리 컨트롤러
 */

import { Request, Response } from 'express';
import * as staffService from '../services/staff.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { Role, Division } from '@prisma/client';

/**
 * 담당자 목록 조회
 * GET /api/v1/staff
 */
export const getStaffList = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      division: req.query.division as Division | undefined,
      role: req.query.role as Role | undefined,
      search: req.query.search as string | undefined,
      department: req.query.department as string | undefined,
    };

    const result = await staffService.getStaffList(query);
    res.json(successResponse(result, '담당자 목록 조회 성공'));
  } catch (error: any) {
    console.error('담당자 목록 조회 오류:', error);
    res.status(400).json(errorResponse(error.message, 'GET_STAFF_LIST_ERROR'));
  }
};

/**
 * 담당자 상세 조회
 * GET /api/v1/staff/:id
 */
export const getStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const staff = await staffService.getStaffById(id);
    res.json(successResponse(staff, '담당자 조회 성공'));
  } catch (error: any) {
    console.error('담당자 조회 오류:', error);
    res.status(404).json(errorResponse(error.message, 'GET_STAFF_ERROR'));
  }
};

/**
 * 담당자 생성
 * POST /api/v1/staff
 */
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;

    // 필수 필드 검증
    if (!data.name || !data.phone || !data.password || !data.role) {
      res.status(400).json(errorResponse('필수 필드가 누락되었습니다', 'MISSING_REQUIRED_FIELDS'));
      return;
    }

    const staff = await staffService.createStaff(data);
    res.status(201).json(successResponse(staff, '담당자가 생성되었습니다'));
  } catch (error: any) {
    console.error('담당자 생성 오류:', error);
    res.status(400).json(errorResponse(error.message, 'CREATE_STAFF_ERROR'));
  }
};

/**
 * 담당자 수정
 * PATCH /api/v1/staff/:id
 */
export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const staff = await staffService.updateStaff(id, data);
    res.json(successResponse(staff, '담당자가 수정되었습니다'));
  } catch (error: any) {
    console.error('담당자 수정 오류:', error);
    res.status(400).json(errorResponse(error.message, 'UPDATE_STAFF_ERROR'));
  }
};

/**
 * 담당자 삭제 (Soft delete)
 * DELETE /api/v1/staff/:id
 */
export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await staffService.deleteStaff(id);
    res.json(successResponse(result, '담당자가 삭제되었습니다'));
  } catch (error: any) {
    console.error('담당자 삭제 오류:', error);
    res.status(400).json(errorResponse(error.message, 'DELETE_STAFF_ERROR'));
  }
};

/**
 * 담당자 사업장 및 그룹 배정
 * POST /api/v1/staff/:id/sites
 */
export const assignStaffToSites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { siteIds = [], siteGroupIds = [] } = req.body;

    if (!Array.isArray(siteIds)) {
      res.status(400).json(errorResponse('siteIds는 배열이어야 합니다', 'INVALID_SITE_IDS'));
      return;
    }

    if (!Array.isArray(siteGroupIds)) {
      res.status(400).json(errorResponse('siteGroupIds는 배열이어야 합니다', 'INVALID_SITE_GROUP_IDS'));
      return;
    }

    const result = await staffService.assignStaffToSitesAndGroups(id, siteIds, siteGroupIds);
    res.json(successResponse(result, '사업장 및 그룹이 배정되었습니다'));
  } catch (error: any) {
    console.error('사업장 배정 오류:', error);
    res.status(400).json(errorResponse(error.message, 'ASSIGN_SITES_ERROR'));
  }
};

/**
 * 비밀번호 초기화
 * POST /api/v1/staff/:id/reset-password
 */
export const resetStaffPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json(errorResponse('새 비밀번호가 필요합니다', 'MISSING_PASSWORD'));
      return;
    }

    const result = await staffService.resetStaffPassword(id, newPassword);
    res.json(successResponse(result, '비밀번호가 초기화되었습니다'));
  } catch (error: any) {
    console.error('비밀번호 초기화 오류:', error);
    res.status(400).json(errorResponse(error.message, 'RESET_PASSWORD_ERROR'));
  }
};
