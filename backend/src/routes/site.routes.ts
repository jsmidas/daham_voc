import { Router } from 'express';
import { SiteController } from '../controllers/site.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import { uploadExcel } from '../middlewares/upload.middleware';
import {
  createSiteSchema,
  updateSiteSchema,
} from '../validators/site.validator';

const router = Router();
const controller = new SiteController();

// GET /api/v1/sites - Get all sites (All authenticated users)
router.get('/', authMiddleware, controller.getSites);

// GET /api/v1/sites/excel-template - Download Excel template (Admin only)
router.get(
  '/excel-template',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.downloadExcelTemplate
);

// POST /api/v1/sites/excel-upload - Bulk create sites from Excel (Admin only)
router.post(
  '/excel-upload',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  uploadExcel,
  controller.uploadExcelFile
);

// GET /api/v1/sites/:id - Get site by ID (All authenticated users)
router.get('/:id', authMiddleware, controller.getSiteById);

// POST /api/v1/sites - Create site (Admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(createSiteSchema),
  controller.createSite
);

// PUT /api/v1/sites/:id - Update site (Admin only)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(updateSiteSchema),
  controller.updateSite
);

// DELETE /api/v1/sites/:id - Delete site (Admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.deleteSite
);

export default router;
