import { Request, Response } from 'express';
import { WeeklyMenuTemplateService } from '../services/weekly-menu-template.service';
import {
  successResponse,
  errorResponse,
} from '../utils/api-response.util';
import { uploadImage } from '../services/storage.service';

export class WeeklyMenuTemplateController {
  private weeklyMenuTemplateService: WeeklyMenuTemplateService;

  constructor() {
    this.weeklyMenuTemplateService = new WeeklyMenuTemplateService();
  }

  /**
   * GET /api/v1/weekly-menu-templates
   * Get all weekly menu templates
   */
  getWeeklyMenuTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { menuTypeId, year, weekNumber } = req.query;

      const filters: any = {};
      if (menuTypeId) filters.menuTypeId = menuTypeId as string;
      if (year) filters.year = parseInt(year as string);
      if (weekNumber) filters.weekNumber = parseInt(weekNumber as string);

      const templates = await this.weeklyMenuTemplateService.getWeeklyMenuTemplates(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json(successResponse({ templates }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_WEEKLY_MENU_TEMPLATES_ERROR'));
    }
  };

  /**
   * GET /api/v1/weekly-menu-templates/:id
   * Get weekly menu template by ID
   */
  getWeeklyMenuTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.weeklyMenuTemplateService.getWeeklyMenuTemplateById(id);
      res.json(successResponse(template));
    } catch (error: any) {
      res.status(404).json(errorResponse(error.message, 'WEEKLY_MENU_TEMPLATE_NOT_FOUND'));
    }
  };

  /**
   * GET /api/v1/weekly-menu-templates/by-year-week
   * Get weekly menu template by year and week
   */
  getWeeklyMenuTemplateByYearWeek = async (req: Request, res: Response): Promise<void> => {
    try {
      const { menuTypeId, year, weekNumber } = req.query;

      if (!menuTypeId || !year || !weekNumber) {
        res.status(400).json(errorResponse('menuTypeId, year, weekNumber가 필요합니다', 'INVALID_PARAMS'));
        return;
      }

      const template = await this.weeklyMenuTemplateService.getWeeklyMenuTemplateByYearWeek(
        menuTypeId as string,
        parseInt(year as string),
        parseInt(weekNumber as string)
      );

      res.json(successResponse(template));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_WEEKLY_MENU_TEMPLATE_ERROR'));
    }
  };

  /**
   * POST /api/v1/weekly-menu-templates
   * Create weekly menu template
   */
  createWeeklyMenuTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const { menuTypeId, year, weekNumber, imageUrl, thumbnailUrl, description } = req.body;

      if (!menuTypeId || !year || !weekNumber || !imageUrl) {
        res.status(400).json(errorResponse('menuTypeId, year, weekNumber, imageUrl가 필요합니다', 'INVALID_PARAMS'));
        return;
      }

      const template = await this.weeklyMenuTemplateService.createWeeklyMenuTemplate(
        {
          menuTypeId,
          year: parseInt(year),
          weekNumber: parseInt(weekNumber),
          imageUrl,
          thumbnailUrl,
          description,
        },
        userId
      );

      res.status(201).json(successResponse(template, '주간 식단표가 생성되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'CREATE_WEEKLY_MENU_TEMPLATE_ERROR'));
    }
  };

  /**
   * PUT /api/v1/weekly-menu-templates/:id
   * Update weekly menu template
   */
  updateWeeklyMenuTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const { imageUrl, thumbnailUrl, description } = req.body;

      const template = await this.weeklyMenuTemplateService.updateWeeklyMenuTemplate(
        id,
        {
          imageUrl,
          thumbnailUrl,
          description,
        },
        userId
      );

      res.json(successResponse(template, '주간 식단표가 수정되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'UPDATE_WEEKLY_MENU_TEMPLATE_ERROR'));
    }
  };

  /**
   * DELETE /api/v1/weekly-menu-templates/:id
   * Delete weekly menu template
   */
  deleteWeeklyMenuTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      await this.weeklyMenuTemplateService.deleteWeeklyMenuTemplate(id, userId);
      res.json(successResponse(null, '주간 식단표가 삭제되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'DELETE_WEEKLY_MENU_TEMPLATE_ERROR'));
    }
  };

  /**
   * GET /api/v1/weekly-menu-templates/site/:siteId
   * Get weekly menu templates for a specific site
   */
  getWeeklyMenuTemplatesForSite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const { year, weekNumber } = req.query;

      const templates = await this.weeklyMenuTemplateService.getWeeklyMenuTemplatesForSite(
        siteId,
        year ? parseInt(year as string) : undefined,
        weekNumber ? parseInt(weekNumber as string) : undefined
      );

      res.json(successResponse({ templates }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_SITE_WEEKLY_MENU_TEMPLATES_ERROR'));
    }
  };

  /**
   * POST /api/v1/weekly-menu-templates/upload
   * Upload weekly menu template image
   */
  uploadWeeklyMenuImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const image = req.file;

      if (!image) {
        res.status(400).json(errorResponse('이미지 파일이 필요합니다', 'IMAGE_REQUIRED'));
        return;
      }

      // Upload to GCP Storage
      const uploaded = await uploadImage(image, 'weekly-menus');

      res.json(
        successResponse(
          {
            imageUrl: uploaded.originalUrl,
            thumbnailUrl: uploaded.thumbnailUrl,
          },
          '이미지가 업로드되었습니다'
        )
      );
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'UPLOAD_IMAGE_ERROR'));
    }
  };
}
