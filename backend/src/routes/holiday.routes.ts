/**
 * Holiday Routes
 * @description 공휴일 관리 라우트
 */

import { Router } from 'express';
import * as holidayController from '../controllers/holiday.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', holidayController.getHolidays);
router.post('/', holidayController.createHoliday);
router.patch('/:id', holidayController.updateHoliday);
router.delete('/:id', holidayController.deleteHoliday);

export default router;
