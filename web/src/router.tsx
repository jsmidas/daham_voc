/**
 * Router Configuration
 * @description React Router 설정
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import MainLayout from '@/components/Layout/MainLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import SiteListPage from '@/pages/site/SiteListPage';
import SiteFormPage from '@/pages/site/SiteFormPage';
import SiteGroupPage from '@/pages/site/SiteGroupPage';
import SiteMapPage from '@/pages/map/SiteMapPage';
import MenuTypePage from '@/pages/menu-type/MenuTypePage';
import WeeklyMenuPage from '@/pages/menu/WeeklyMenuPage';
import PhotoGalleryPage from '@/pages/photo/PhotoGalleryPage';
import MealPhotoManagementPage from '@/pages/meal-photo/MealPhotoManagementPage';
import FeedbackListPage from '@/pages/feedback/FeedbackListPage';
import StaffListPage from '@/pages/staff/StaffListPage';
import StaffFormPage from '@/pages/staff/StaffFormPage';
import AttendanceListPage from '@/pages/attendance/AttendanceListPage';
import StatsPage from '@/pages/stats/StatsPage';
import MealCountSettingPage from '@/pages/meal-count/MealCountSettingPage';
import MealCountListPage from '@/pages/meal-count/MealCountListPage';
import MealMenuPage from '@/pages/meal-menu/MealMenuPage';
import DeliveryRouteListPage from '@/pages/delivery-route/DeliveryRouteListPage';
import DeliveryRouteDetailPage from '@/pages/delivery-route/DeliveryRouteDetailPage';
import DeliveryLogPage from '@/pages/delivery-log/DeliveryLogPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';

// Protected Route 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 라우터 정의
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'change-password',
        element: <ChangePasswordPage />,
      },
      {
        path: 'sites',
        children: [
          { index: true, element: <SiteListPage /> },
          { path: 'new', element: <SiteFormPage /> },
          { path: ':id/edit', element: <SiteFormPage /> },
        ],
      },
      {
        path: 'site-groups',
        element: <SiteGroupPage />,
      },
      {
        path: 'map',
        element: <SiteMapPage />,
      },
      {
        path: 'menus',
        element: <Navigate to="/weekly-menus" replace />,
      },
      {
        path: 'menu-types',
        element: <MenuTypePage />,
      },
      {
        path: 'weekly-menus',
        element: <WeeklyMenuPage />,
      },
      {
        path: 'photos',
        element: <PhotoGalleryPage />,
      },
      {
        path: 'meal-photos',
        element: <MealPhotoManagementPage />,
      },
      {
        path: 'feedbacks',
        element: <FeedbackListPage />,
      },
      {
        path: 'staff',
        children: [
          { index: true, element: <StaffListPage /> },
          { path: 'new', element: <StaffFormPage /> },
          { path: ':id/edit', element: <StaffFormPage /> },
        ],
      },
      {
        path: 'attendances',
        element: <AttendanceListPage />,
      },
      {
        path: 'stats',
        element: <StatsPage />,
      },
      {
        path: 'meal-count-settings',
        element: <MealCountSettingPage />,
      },
      {
        path: 'meal-counts',
        element: <MealCountListPage />,
      },
      {
        path: 'meal-menus',
        element: <MealMenuPage />,
      },
      {
        path: 'delivery-routes',
        children: [
          { index: true, element: <DeliveryRouteListPage /> },
          { path: ':id', element: <DeliveryRouteDetailPage /> },
        ],
      },
      {
        path: 'delivery-logs',
        element: <DeliveryLogPage />,
      },
    ],
  },
]);
