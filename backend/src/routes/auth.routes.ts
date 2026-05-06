import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/auth.validator';

const router = Router();
const controller = new AuthController();

// POST /api/v1/auth/register - Register new user
router.post('/register', validateRequest(registerSchema), controller.register);

// POST /api/v1/auth/register-customer - 고객 셀프 회원가입
router.post('/register-customer', controller.registerCustomer);

// POST /api/v1/auth/login - Login
router.post('/login', validateRequest(loginSchema), controller.login);

// GET /api/v1/auth/me - Get current user (requires authentication)
router.get('/me', authMiddleware, controller.getCurrentUser);

// PUT /api/v1/auth/password - Change password (requires authentication)
router.put(
  '/password',
  authMiddleware,
  validateRequest(changePasswordSchema),
  controller.changePassword
);

// DELETE /api/v1/auth/account - 회원 탈퇴 (Apple Guideline 5.1.1(v))
router.delete(
  '/account',
  authMiddleware,
  validateRequest(deleteAccountSchema),
  controller.deleteAccount
);

export default router;
