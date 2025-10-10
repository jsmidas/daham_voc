import { Router } from 'express';
import authRoutes from './auth.routes';
import siteRoutes from './site.routes';
import siteGroupRoutes from './site-group.routes';
import menuRoutes from './menu.routes';
import mealPhotoRoutes from './meal-photo.routes';
import feedbackRoutes from './feedback.routes';
import attendanceRoutes from './attendance.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// API v1 routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sites', siteRoutes);
router.use('/site-groups', siteGroupRoutes);
router.use('/menus', menuRoutes);
router.use('/meal-photos', mealPhotoRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/attendances', attendanceRoutes);

// Future routes will be added here:
// router.use('/staff', staffRoutes);
// router.use('/stats', statsRoutes);

export default router;
