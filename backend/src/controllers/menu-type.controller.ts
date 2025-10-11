import { Request, Response } from 'express';
import { MenuTypeService } from '../services/menu-type.service';
import {
  successResponse,
  errorResponse,
} from '../utils/api-response.util';

export class MenuTypeController {
  private menuTypeService: MenuTypeService;

  constructor() {
    this.menuTypeService = new MenuTypeService();
  }

  /**
   * GET /api/v1/menu-types
   * Get all menu types
   */
  getMenuTypes = async (_req: Request, res: Response): Promise<void> => {
    try {
      const menuTypes = await this.menuTypeService.getMenuTypes();
      res.json(successResponse({ menuTypes }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message, 'GET_MENU_TYPES_ERROR'));
    }
  };

  /**
   * GET /api/v1/menu-types/:id
   * Get menu type by ID
   */
  getMenuTypeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const menuType = await this.menuTypeService.getMenuTypeById(id);
      res.json(successResponse(menuType));
    } catch (error: any) {
      res.status(404).json(errorResponse(error.message, 'MENU_TYPE_NOT_FOUND'));
    }
  };

  /**
   * POST /api/v1/menu-types
   * Create menu type
   */
  createMenuType = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const menuType = await this.menuTypeService.createMenuType(req.body, userId);
      res.status(201).json(successResponse(menuType, '식단 유형이 생성되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'CREATE_MENU_TYPE_ERROR'));
    }
  };

  /**
   * PUT /api/v1/menu-types/:id
   * Update menu type
   */
  updateMenuType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const menuType = await this.menuTypeService.updateMenuType(id, req.body, userId);
      res.json(successResponse(menuType, '식단 유형이 수정되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'UPDATE_MENU_TYPE_ERROR'));
    }
  };

  /**
   * DELETE /api/v1/menu-types/:id
   * Delete menu type (soft delete)
   */
  deleteMenuType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      await this.menuTypeService.deleteMenuType(id, userId);
      res.json(successResponse(null, '식단 유형이 삭제되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'DELETE_MENU_TYPE_ERROR'));
    }
  };
}
