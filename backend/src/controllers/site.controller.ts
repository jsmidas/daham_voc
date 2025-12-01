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
      const user = (req as any).user;

      const filter = {
        type: req.query.type as any,
        division: req.query.division as any,
        groupId: req.query.groupId as string,
        search: req.query.search as string,
      };

      // 권한별 필터링
      // SUPER_ADMIN: 모든 사업장
      // HQ_ADMIN: 본사(HQ) + 위탁(CONSIGNMENT) 사업장
      // YEONGNAM_ADMIN: 영남지사(YEONGNAM) 사업장만
      if (user.role === 'HQ_ADMIN' && !filter.division) {
        // HQ_ADMIN은 HQ와 CONSIGNMENT 모두 조회 가능
        // filter.division을 설정하지 않고 service에서 직접 처리하도록 user 전달
      } else if (user.role === 'YEONGNAM_ADMIN' && !filter.division) {
        filter.division = 'YEONGNAM';
      }

      const pagination = parsePaginationParams(
        req.query.page as string,
        req.query.limit as string
      );

      const { sites, total } = await this.siteService.getSites(filter, pagination, user);

      const meta = createPaginationMeta(pagination.page, pagination.limit, total);

      res.json(successResponse({ sites }, undefined, meta));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_SITES_ERROR'));
    }
  };

  /**
   * GET /api/v1/sites/light
   * Get lightweight sites list (for dropdowns, selects, etc.)
   */
  getSitesLight = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      const filter = {
        division: req.query.division as any,
        isActive: req.query.isActive !== 'false',
      };

      const sites = await this.siteService.getSitesLight(filter, user);

      res.json(successResponse({ sites }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_SITES_LIGHT_ERROR'));
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
      console.log('=== Excel Upload Request ===');
      console.log('Content-Type:', req.headers['content-type']);
      console.log('req.file:', req.file);
      console.log('req.files:', req.files);

      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      if (!req.file) {
        console.error('❌ File not found in request');
        res.status(400).json(errorResponse('엑셀 파일이 필요합니다', 'FILE_REQUIRED'));
        return;
      }

      console.log('✅ File received:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const result = await this.siteService.bulkCreateFromExcel(req.file.buffer, userId);

      const message = result.failed.length > 0
        ? `${result.success}개 생성 완료, ${result.failed.length}개 실패`
        : `${result.success}개 사업장이 생성되었습니다`;

      res.json(successResponse(result, message));
    } catch (error: any) {
      console.error('Excel upload error:', error);
      res.status(400).json(errorResponse(error.message, 'EXCEL_UPLOAD_ERROR'));
    }
  };

  /**
   * GET /api/v1/user/sites
   * Get sites assigned to current user
   * @description 현재 로그인한 사용자에게 배정된 사업장만 반환
   */
  getUserAssignedSites = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const sites = await this.siteService.getUserAssignedSites(userId);
      res.json(successResponse({ sites }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_USER_SITES_ERROR'));
    }
  };
}
