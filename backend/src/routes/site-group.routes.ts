import { Router } from 'express';
import { SiteGroupController } from '../controllers/site-group.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import {
  createSiteGroupSchema,
  updateSiteGroupSchema,
  manageSitesSchema,
} from '../validators/site-group.validator';

const router = Router();
const controller = new SiteGroupController();

// GET /api/v1/site-groups - Get all site groups
router.get('/', authMiddleware, controller.getGroups);

// GET /api/v1/site-groups/:id - Get site group by ID
router.get('/:id', authMiddleware, controller.getGroupById);

// POST /api/v1/site-groups - Create site group (Admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(createSiteGroupSchema),
  controller.createGroup
);

// PUT /api/v1/site-groups/:id - Update site group (Admin only)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(updateSiteGroupSchema),
  controller.updateGroup
);

// DELETE /api/v1/site-groups/:id - Delete site group (Admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.deleteGroup
);

// POST /api/v1/site-groups/:id/sites - Add sites to group (Admin only)
router.post(
  '/:id/sites',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(manageSitesSchema),
  controller.addSites
);

// DELETE /api/v1/site-groups/:id/sites - Remove sites from group (Admin only)
router.delete(
  '/:id/sites',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(manageSitesSchema),
  controller.removeSites
);

export default router;
