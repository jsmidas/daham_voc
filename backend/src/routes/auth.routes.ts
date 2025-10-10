import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();
const controller = new AuthController();

// POST /api/v1/auth/register - Register new user
router.post('/register', validateRequest(registerSchema), controller.register);

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

export default router;
