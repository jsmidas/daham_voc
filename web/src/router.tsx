/**
 * Router Configuration
 * @description React Router 설정 - lazy loading으로 초기 로딩 최적화
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore, WEB_ALLOWED_ROLES, type Role } from '@/store/authStore';
import { Spin } from 'antd';

// Layouts (항상 로드)
import MainLayout from '@/components/Layout/MainLayout';

// Login (항상 로드 - 첫 화면)
import LoginPage from '@/pages/auth/LoginPage';

// Lazy loaded pages
const ChangePasswordPage = lazy(() => import('@/pages/auth/ChangePasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const SiteListPage = lazy(() => import('@/pages/site/SiteListPage'));
const SiteFormPage = lazy(() => import('@/pages/site/SiteFormPage'));
const SiteGroupPage = lazy(() => import('@/pages/site/SiteGroupPage'));
const SiteMapPage = lazy(() => import('@/pages/map/SiteMapPage'));
const MenuTypePage = lazy(() => import('@/pages/menu-type/MenuTypePage'));
const WeeklyMenuPage = lazy(() => import('@/pages/menu/WeeklyMenuPage'));
const PhotoGalleryPage = lazy(() => import('@/pages/photo/PhotoGalleryPage'));
const MealPhotoManagementPage = lazy(() => import('@/pages/meal-photo/MealPhotoManagementPage'));
const FeedbackListPage = lazy(() => import('@/pages/feedback/FeedbackListPage'));
const StaffListPage = lazy(() => import('@/pages/staff/StaffListPage'));
const StaffFormPage = lazy(() => import('@/pages/staff/StaffFormPage'));
const AttendanceListPage = lazy(() => import('@/pages/attendance/AttendanceListPage'));
const AttendanceDashboardPage = lazy(() => import('@/pages/attendance/AttendanceDashboardPage'));
const HolidayManagementPage = lazy(() => import('@/pages/attendance/HolidayManagementPage'));
const AttendanceSettingsPage = lazy(() => import('@/pages/attendance/AttendanceSettingsPage'));
const AttendanceMonthlyReportPage = lazy(() => import('@/pages/attendance/AttendanceMonthlyReportPage'));
const StatsPage = lazy(() => import('@/pages/stats/StatsPage'));
const MealCountSettingPage = lazy(() => import('@/pages/meal-count/MealCountSettingPage'));
const MealCountListPage = lazy(() => import('@/pages/meal-count/MealCountListPage'));
const MealMenuPage = lazy(() => import('@/pages/meal-menu/MealMenuPage'));
const DeliveryRouteListPage = lazy(() => import('@/pages/delivery-route/DeliveryRouteListPage'));
const DeliveryRouteDetailPage = lazy(() => import('@/pages/delivery-route/DeliveryRouteDetailPage'));
const DeliveryLogPage = lazy(() => import('@/pages/delivery-log/DeliveryLogPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const ContractListPage = lazy(() => import('@/pages/contract/ContractListPage'));

// Lazy wrapper
const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}>
    {children}
  </Suspense>
);

// Protected Route 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 웹 접속 불가 역할 체크 (SITE_MANAGER, DELIVERY_DRIVER, CLIENT)
  if (user && !WEB_ALLOWED_ROLES.includes(user.role as Role)) {
    // 권한 없는 역할은 로그아웃 처리 후 로그인 페이지로 이동
    logout();
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
    element: <L><PrivacyPolicyPage /></L>,
  },
  {
    path: '/privacy',
    element: <L><PrivacyPolicyPage /></L>,
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
        element: <L><DashboardPage /></L>,
      },
      {
        path: 'change-password',
        element: <L><ChangePasswordPage /></L>,
      },
      {
        path: 'sites',
        children: [
          { index: true, element: <L><SiteListPage /></L> },
          { path: 'new', element: <L><SiteFormPage /></L> },
          { path: ':id/edit', element: <L><SiteFormPage /></L> },
        ],
      },
      {
        path: 'site-groups',
        element: <L><SiteGroupPage /></L>,
      },
      {
        path: 'map',
        element: <L><SiteMapPage /></L>,
      },
      {
        path: 'menus',
        element: <Navigate to="/weekly-menus" replace />,
      },
      {
        path: 'menu-types',
        element: <L><MenuTypePage /></L>,
      },
      {
        path: 'weekly-menus',
        element: <L><WeeklyMenuPage /></L>,
      },
      {
        path: 'photos',
        element: <L><PhotoGalleryPage /></L>,
      },
      {
        path: 'meal-photos',
        element: <L><MealPhotoManagementPage /></L>,
      },
      {
        path: 'feedbacks',
        element: <L><FeedbackListPage /></L>,
      },
      {
        path: 'staff',
        children: [
          { index: true, element: <L><StaffListPage /></L> },
          { path: 'new', element: <L><StaffFormPage /></L> },
          { path: ':id/edit', element: <L><StaffFormPage /></L> },
        ],
      },
      {
        path: 'attendances',
        children: [
          { index: true, element: <L><AttendanceListPage /></L> },
          { path: 'dashboard', element: <L><AttendanceDashboardPage /></L> },
          { path: 'settings', element: <L><AttendanceSettingsPage /></L> },
          { path: 'report', element: <L><AttendanceMonthlyReportPage /></L> },
          { path: 'holidays', element: <L><HolidayManagementPage /></L> },
        ],
      },
      {
        path: 'stats',
        element: <L><StatsPage /></L>,
      },
      {
        path: 'meal-count-settings',
        element: <L><MealCountSettingPage /></L>,
      },
      {
        path: 'meal-counts',
        element: <L><MealCountListPage /></L>,
      },
      {
        path: 'meal-menus',
        element: <L><MealMenuPage /></L>,
      },
      {
        path: 'delivery-routes',
        children: [
          { index: true, element: <L><DeliveryRouteListPage /></L> },
          { path: ':id', element: <L><DeliveryRouteDetailPage /></L> },
        ],
      },
      {
        path: 'delivery-logs',
        element: <L><DeliveryLogPage /></L>,
      },
      {
        path: 'contracts',
        element: <L><ContractListPage /></L>,
      },
    ],
  },
]);
