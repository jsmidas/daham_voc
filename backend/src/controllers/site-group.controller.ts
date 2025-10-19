import { Request, Response } from 'express';
import { SiteGroupService } from '../services/site-group.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

export class SiteGroupController {
  private siteGroupService: SiteGroupService;

  constructor() {
    this.siteGroupService = new SiteGroupService();
  }

  /**
   * GET /api/v1/site-groups/hierarchy
   * Get hierarchy structure (다함푸드 > 본사/영남 > 그룹 > 사업장)
   */
  getHierarchy = async (_req: Request, res: Response): Promise<void> => {
    try {
      const hierarchy = await this.siteGroupService.getHierarchy();
      res.json(successResponse(hierarchy));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_HIERARCHY_ERROR'));
    }
  };

  /**
   * GET /api/v1/site-groups
   * Get all site groups
   */
  getGroups = async (req: Request, res: Response): Promise<void> => {
    try {
      const division = req.query.division as any;
      const groups = await this.siteGroupService.getGroups(division);

      res.json(successResponse({ groups }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_GROUPS_ERROR'));
    }
  };

  /**
   * GET /api/v1/site-groups/:id
   * Get site group by ID
   */
  getGroupById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const group = await this.siteGroupService.getGroupById(id);

      res.json(successResponse(group));
    } catch (error: any) {
      res.status(404).json(errorResponse(error.message, 'GROUP_NOT_FOUND'));
    }
  };

  /**
   * POST /api/v1/site-groups
   * Create new site group
   */
  createGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const group = await this.siteGroupService.createGroup(req.body, userId);

      res.status(201).json(successResponse(group, '그룹이 생성되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'CREATE_GROUP_ERROR'));
    }
  };

  /**
   * PUT /api/v1/site-groups/:id
   * Update site group
   */
  updateGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const group = await this.siteGroupService.updateGroup(id, req.body, userId);

      res.json(successResponse(group, '그룹이 수정되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'UPDATE_GROUP_ERROR'));
    }
  };

  /**
   * DELETE /api/v1/site-groups/:id
   * Delete site group
   */
  deleteGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      await this.siteGroupService.deleteGroup(id, userId);

      res.json(successResponse(null, '그룹이 삭제되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'DELETE_GROUP_ERROR'));
    }
  };

  /**
   * POST /api/v1/site-groups/:id/sites
   * Add sites to group
   */
  addSites = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { siteIds } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      if (!Array.isArray(siteIds) || siteIds.length === 0) {
        res.status(400).json(errorResponse('사업장 ID 배열이 필요합니다', 'INVALID_INPUT'));
        return;
      }

      await this.siteGroupService.addSitesToGroup(id, siteIds, userId);

      res.json(successResponse(null, '사업장이 그룹에 추가되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'ADD_SITES_ERROR'));
    }
  };

  /**
   * DELETE /api/v1/site-groups/:id/sites
   * Remove sites from group
   */
  removeSites = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { siteIds } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      if (!Array.isArray(siteIds) || siteIds.length === 0) {
        res.status(400).json(errorResponse('사업장 ID 배열이 필요합니다', 'INVALID_INPUT'));
        return;
      }

      await this.siteGroupService.removeSitesFromGroup(id, siteIds, userId);

      res.json(successResponse(null, '사업장이 그룹에서 제거되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'REMOVE_SITES_ERROR'));
    }
  };
}
