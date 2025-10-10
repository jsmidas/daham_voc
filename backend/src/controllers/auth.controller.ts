import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json(successResponse(result, '회원가입이 완료되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'REGISTRATION_ERROR'));
    }
  };

  /**
   * POST /api/v1/auth/login
   * Login user (using phone number)
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, password } = req.body;
      const result = await this.authService.login(phone, password);

      res.json(successResponse(result, '로그인 성공'));
    } catch (error: any) {
      res.status(401).json(errorResponse(error.message, 'LOGIN_ERROR'));
    }
  };

  /**
   * GET /api/v1/auth/me
   * Get current user
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const user = await this.authService.getCurrentUser(userId);

      res.json(successResponse(user));
    } catch (error: any) {
      res.status(404).json(errorResponse(error.message, 'USER_NOT_FOUND'));
    }
  };

  /**
   * PUT /api/v1/auth/password
   * Change password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json(errorResponse('인증되지 않은 사용자입니다', 'UNAUTHORIZED'));
        return;
      }

      const { oldPassword, newPassword } = req.body;

      await this.authService.changePassword(userId, oldPassword, newPassword);

      res.json(successResponse(null, '비밀번호가 변경되었습니다'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message, 'PASSWORD_CHANGE_ERROR'));
    }
  };
}
