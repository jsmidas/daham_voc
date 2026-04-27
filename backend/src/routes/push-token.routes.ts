/**
 * Push Token Routes
 */

import { Router } from 'express';
import * as ctl from '../controllers/push-token.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/register', ctl.register);
router.post('/unregister', ctl.unregister);

export default router;
