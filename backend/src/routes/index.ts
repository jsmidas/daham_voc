import { Router } from 'express';
import authRoutes from './auth.routes';
import siteRoutes from './site.routes';
import siteGroupRoutes from './site-group.routes';
import menuRoutes from './menu.routes';
import menuTypeRoutes from './menu-type.routes';
import weeklyMenuTemplateRoutes from './weekly-menu-template.routes';
import mealPhotoRoutes from './meal-photo.routes';
import feedbackRoutes from './feedback.routes';
import staffRoutes from './staff.routes';
import attendanceRoutes from './attendance.routes';
import dashboardRoutes from './dashboard.routes';
import mealCountRoutes from './meal-count.routes';
import deliveryRouteRoutes from './delivery-route.routes';
import deliveryLogRoutes from './delivery-log.routes';

const router = Router();

// Root API info endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Daham VOC API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      dashboard: '/dashboard',
      sites: '/sites',
      siteGroups: '/site-groups',
      menus: '/menus',
      menuTypes: '/menu-types',
      weeklyMenuTemplates: '/weekly-menu-templates',
      mealPhotos: '/meal-photos',
      feedbacks: '/feedbacks',
      staff: '/staff',
      attendances: '/attendances',
      mealCounts: '/meal-counts',
      deliveryRoutes: '/delivery-routes',
      deliveryLogs: '/delivery-logs',
    },
  });
});

// API v1 routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sites', siteRoutes);
router.use('/site-groups', siteGroupRoutes);
router.use('/menus', menuRoutes);
router.use('/menu-types', menuTypeRoutes);
router.use('/weekly-menu-templates', weeklyMenuTemplateRoutes);
router.use('/meal-photos', mealPhotoRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/staff', staffRoutes);
router.use('/attendances', attendanceRoutes);
router.use('/meal-counts', mealCountRoutes);
router.use('/delivery-routes', deliveryRouteRoutes);
router.use('/delivery-logs', deliveryLogRoutes);

// Future routes will be added here:
// router.use('/stats', statsRoutes);

export default router;
