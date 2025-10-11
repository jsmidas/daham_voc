import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { WeeklyMenuTemplateController } from '../controllers/weekly-menu-template.controller';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();
const controller = new WeeklyMenuTemplateController();

// Get all weekly menu templates (with optional filters)
router.get('/', controller.getWeeklyMenuTemplates);

// Get weekly menu template by year and week
router.get('/by-year-week', controller.getWeeklyMenuTemplateByYearWeek);

// Get weekly menu templates for a specific site
router.get('/site/:siteId', controller.getWeeklyMenuTemplatesForSite);

// Get weekly menu template by ID
router.get('/:id', controller.getWeeklyMenuTemplateById);

// Upload image (requires authentication)
router.post('/upload', authMiddleware, uploadSingle, controller.uploadWeeklyMenuImage);

// Create weekly menu template (requires authentication)
router.post('/', authMiddleware, controller.createWeeklyMenuTemplate);

// Update weekly menu template (requires authentication)
router.put('/:id', authMiddleware, controller.updateWeeklyMenuTemplate);

// Delete weekly menu template (requires authentication)
router.delete('/:id', authMiddleware, controller.deleteWeeklyMenuTemplate);

export default router;
