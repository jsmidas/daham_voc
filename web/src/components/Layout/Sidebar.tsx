/**
 * Sidebar Component
 * @description 사이드바 네비게이션 컴포넌트
 */

import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  CalendarOutlined,
  CameraOutlined,
  MessageOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  CarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
    {
      key: 'site-group',
      icon: <ShopOutlined />,
      label: '사업장',
      children: [
        { key: '/sites', label: '사업장 관리' },
        { key: '/site-groups', label: '사업장 그룹' },
        { key: '/map', icon: <EnvironmentOutlined />, label: '사업장 지도' },
      ],
    },
    {
      key: 'delivery-group',
      icon: <CarOutlined />,
      label: '배송',
      children: [
        { key: '/delivery-routes', label: '배송 코스 관리' },
        { key: '/delivery-routes/schedule', label: '배송 스케줄' },
        { key: '/delivery-logs', label: '배송 이력' },
      ],
    },
    {
      key: 'menu-group',
      icon: <CalendarOutlined />,
      label: '식단',
      children: [
        { key: '/menu-types', label: '식단유형 관리' },
        { key: '/weekly-menus', label: '주간 식단표' },
      ],
    },
    {
      key: 'meal-group',
      icon: <AppstoreOutlined />,
      label: '식수',
      children: [
        { key: '/meal-counts', label: '식수 조회/수정' },
        { key: '/meal-menus', label: '식수 메뉴 관리' },
        { key: '/meal-count-settings', label: '식수 마감시간' },
      ],
    },
    { key: '/meal-photos', icon: <CameraOutlined />, label: '배식사진 관리' },
    { key: '/feedbacks', icon: <MessageOutlined />, label: 'VOC 관리' },
    { key: '/contracts', icon: <FileTextOutlined />, label: '전자계약서' },
    {
      key: 'user-group',
      icon: <TeamOutlined />,
      label: '인원 관리',
      children: [
        { key: '/staff', label: '담당자 관리' },
        { key: '/customers', label: '일반고객' },
      ],
    },
    {
      key: 'attendance-group',
      icon: <ClockCircleOutlined />,
      label: '근태 관리',
      children: [
        { key: '/attendances/dashboard', label: '출퇴근 대시보드' },
        { key: '/attendances', label: '근태 현황' },
        { key: '/attendances/report', label: '월별 리포트' },
        { key: '/attendances/settings', label: '근무지 설정' },
        { key: '/attendances/holidays', label: '공휴일 관리' },
      ],
    },
    { key: '/stats', icon: <BarChartOutlined />, label: '통계 조회' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) navigate(key);
  };

  // 현재 경로에 해당하는 그룹을 펼쳐두기
  const getOpenKeys = (): string[] => {
    const path = location.pathname;
    if (path.startsWith('/sites') || path.startsWith('/site-groups') || path.startsWith('/map')) return ['site-group'];
    if (path.startsWith('/delivery-routes') || path.startsWith('/delivery-logs')) return ['delivery-group'];
    if (path.startsWith('/menu-types') || path.startsWith('/weekly-menus')) return ['menu-group'];
    if (path.startsWith('/meal-counts') || path.startsWith('/meal-menus') || path.startsWith('/meal-count-settings')) return ['meal-group'];
    if (path.startsWith('/staff') || path.startsWith('/customers')) return ['user-group'];
    if (path.startsWith('/attendances')) return ['attendance-group'];
    return [];
  };

  // 현재 경로에서 메뉴 키 찾기
  const getSelectedKey = () => {
    const path = location.pathname;
    // /sites/new, /sites/:id/edit 등도 /sites로 선택되도록
    if (path.startsWith('/sites')) return '/sites';
    if (path === '/delivery-routes/schedule') return '/delivery-routes/schedule';
    if (path.startsWith('/delivery-routes')) return '/delivery-routes';
    if (path.startsWith('/delivery-logs')) return '/delivery-logs';
    if (path.startsWith('/attendances/dashboard')) return '/attendances/dashboard';
    if (path.startsWith('/attendances/holidays')) return '/attendances/holidays';
    if (path.startsWith('/attendances/settings')) return '/attendances/settings';
    if (path.startsWith('/attendances/report')) return '/attendances/report';
    if (path === '/attendances') return '/attendances';
    if (path.startsWith('/contracts')) return '/contracts';
    if (path.startsWith('/menu-types')) return '/menu-types';
    if (path.startsWith('/weekly-menus')) return '/weekly-menus';
    if (path.startsWith('/meal-count-settings')) return '/meal-count-settings';
    if (path.startsWith('/meal-counts')) return '/meal-counts';
    if (path.startsWith('/meal-menus')) return '/meal-menus';
    if (path.startsWith('/meal-photos')) return '/meal-photos';
    if (path.startsWith('/customers')) return '/customers';
    return path;
  };

  return (
    <Sider width={200} style={{ background: '#001529' }}>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold',
        }}
      >
        Daham VOC
      </div>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        theme="dark"
        style={{ borderRight: 0 }}
      />
      <style>{`
        .ant-menu-item .ant-menu-title-content {
          pointer-events: none !important;
        }
        .ant-menu-item {
          pointer-events: auto !important;
        }
        .ant-menu-inline .ant-menu-item,
        .ant-menu-inline .ant-menu-submenu-title {
          height: 36px !important;
          line-height: 36px !important;
          margin: 2px 0 !important;
        }
        .ant-menu-inline .ant-menu-sub .ant-menu-item {
          height: 32px !important;
          line-height: 32px !important;
          padding-left: 40px !important;
        }
      `}</style>
    </Sider>
  );
}
