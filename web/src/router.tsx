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
import MenuListPage from '@/pages/menu/MenuListPage';
import MenuFormPage from '@/pages/menu/MenuFormPage';
import PhotoGalleryPage from '@/pages/photo/PhotoGalleryPage';
import FeedbackListPage from '@/pages/feedback/FeedbackListPage';
import StaffListPage from '@/pages/staff/StaffListPage';
import AttendanceListPage from '@/pages/attendance/AttendanceListPage';
import StatsPage from '@/pages/stats/StatsPage';

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
        children: [
          { index: true, element: <MenuListPage /> },
          { path: 'new', element: <MenuFormPage /> },
          { path: ':id/edit', element: <MenuFormPage /> },
        ],
      },
      {
        path: 'photos',
        element: <PhotoGalleryPage />,
      },
      {
        path: 'feedbacks',
        element: <FeedbackListPage />,
      },
      {
        path: 'staff',
        element: <StaffListPage />,
      },
      {
        path: 'attendances',
        element: <AttendanceListPage />,
      },
      {
        path: 'stats',
        element: <StatsPage />,
      },
    ],
  },
]);
