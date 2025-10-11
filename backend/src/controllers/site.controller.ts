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

  /**
   * PATCH /api/v1/sites/order
   * Batch update site orders
   */
  updateSiteOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json(errorResponse('업데이트할 사업장 목록이 필요합니다', 'INVALID_INPUT'));
        return;
      }

      await this.siteService.batchUpdateSiteOrders(updates, userId);

      res.json(successResponse(null, '사업장 순서가 업데이트되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'UPDATE_ORDER_ERROR'));
    }
  };

  /**
   * GET /api/v1/sites/excel-template
   * Download Excel template for bulk site registration
   */
  downloadExcelTemplate = async (_req: Request, res: Response): Promise<void> => {
    try {
      const buffer = await this.siteService.generateExcelTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=site-template.xlsx');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'EXCEL_TEMPLATE_ERROR'));
    }
  };

  /**
   * POST /api/v1/sites/excel-upload
   * Upload and process Excel file for bulk site creation
   */
  uploadExcelFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      if (!req.file) {
        res.status(400).json(errorResponse('엑셀 파일이 필요합니다', 'FILE_REQUIRED'));
        return;
      }

      const result = await this.siteService.bulkCreateFromExcel(req.file.buffer, userId);

      const message = result.failed.length > 0
        ? `${result.success}개 생성 완료, ${result.failed.length}개 실패`
        : `${result.success}개 사업장이 생성되었습니다`;

      res.json(successResponse(result, message));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'EXCEL_UPLOAD_ERROR'));
    }
  };
}
