import { Request, Response } from 'express';
import { SiteService } from '../services/site.service';
import {
  successResponse,
  errorResponse,
  createPaginationMeta,
} from '../utils/api-response.util';
import { parsePaginationParams } from '../utils/pagination.util';

export class SiteController {
  private siteService: SiteService;

  constructor() {
    this.siteService = new SiteService();
  }

  /**
   * GET /api/v1/sites
   * Get all sites with filtering and pagination
   */
  getSites = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = {
        type: req.query.type as any,
        division: req.query.division as any,
        groupId: req.query.groupId as string,
        search: req.query.search as string,
      };

      const pagination = parsePaginationParams(
        req.query.page as string,
        req.query.limit as string
      );

      const { sites, total } = await this.siteService.getSites(filter, pagination);

      const meta = createPaginationMeta(pagination.page, pagination.limit, total);

      res.json(successResponse({ sites }, undefined, meta));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_SITES_ERROR'));
    }
  };

  /**
   * GET /api/v1/sites/:id
   * Get site by ID
   */
  getSiteById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const site = await this.siteService.getSiteById(id, userId);

      res.json(successResponse(site));
    } catch (error: any) {
      res.status(404).json(errorResponse(error.message, 'SITE_NOT_FOUND'));
    }
  };

  /**
   * POST /api/v1/sites
   * Create new site
   */
  createSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const site = await this.siteService.createSite(req.body, userId);

      res.status(201).json(successResponse(site, '사업장이 생성되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'CREATE_SITE_ERROR'));
    }
  };

  /**
   * PUT /api/v1/sites/:id
   * Update site
   */
  updateSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const site = await this.siteService.updateSite(id, req.body, userId);

      res.json(successResponse(site, '사업장이 수정되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'UPDATE_SITE_ERROR'));
    }
  };

  /**
   * DELETE /api/v1/sites/:id
   * Delete site (soft delete)
   */
  deleteSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      await this.siteService.deleteSite(id, userId);

      res.json(successResponse(null, '사업장이 삭제되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'DELETE_SITE_ERROR'));
    }
  };
}
