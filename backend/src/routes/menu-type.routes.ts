import { Router } from 'express';
import { MenuTypeController } from '../controllers/menu-type.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const menuTypeController = new MenuTypeController();

/**
 * @route   GET /api/v1/menu-types
 * @desc    Get all menu types
 * @access  Private
 */
router.get('/', authMiddleware, menuTypeController.getMenuTypes);

/**
 * @route   GET /api/v1/menu-types/:id
 * @desc    Get menu type by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, menuTypeController.getMenuTypeById);

/**
 * @route   POST /api/v1/menu-types
 * @desc    Create menu type
 * @access  Private (SUPER_ADMIN, HQ_ADMIN only)
 */
router.post('/', authMiddleware, menuTypeController.createMenuType);

/**
 * @route   PUT /api/v1/menu-types/:id
 * @desc    Update menu type
 * @access  Private (SUPER_ADMIN, HQ_ADMIN only)
 */
router.put('/:id', authMiddleware, menuTypeController.updateMenuType);

/**
 * @route   DELETE /api/v1/menu-types/:id
 * @desc    Delete menu type (soft delete)
 * @access  Private (SUPER_ADMIN, HQ_ADMIN only)
 */
router.delete('/:id', authMiddleware, menuTypeController.deleteMenuType);

export default router;
