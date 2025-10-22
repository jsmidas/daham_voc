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
  UserOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <span>대시보드</span>,
    },
    {
      key: '/sites',
      icon: <ShopOutlined />,
      label: <span>사업장 관리</span>,
    },
    {
      key: '/site-groups',
      icon: <ShopOutlined />,
      label: <span>사업장 그룹</span>,
    },
    {
      key: '/map',
      icon: <EnvironmentOutlined />,
      label: <span>사업장 지도</span>,
    },
    {
      key: '/delivery-routes',
      icon: <CarOutlined />,
      label: <span>배송 코스 관리</span>,
    },
    {
      key: '/delivery-logs',
      icon: <CarOutlined />,
      label: <span>배송 이력</span>,
    },
    {
      key: '/menu-types',
      icon: <AppstoreOutlined />,
      label: <span>식단유형 관리</span>,
    },
    {
      key: '/weekly-menus',
      icon: <CalendarOutlined />,
      label: <span>주간 식단표</span>,
    },
    {
      key: '/meal-counts',
      icon: <UserOutlined />,
      label: <span>식수 조회/수정</span>,
    },
    {
      key: '/meal-count-settings',
      icon: <ClockCircleOutlined />,
      label: <span>식수 마감시간</span>,
    },
    {
      key: '/meal-photos',
      icon: <CameraOutlined />,
      label: <span>배식사진 관리</span>,
    },
    {
      key: '/feedbacks',
      icon: <MessageOutlined />,
      label: <span>VOC 관리</span>,
    },
    {
      key: '/staff',
      icon: <TeamOutlined />,
      label: <span>담당자 관리</span>,
    },
    {
      key: '/attendances',
      icon: <ClockCircleOutlined />,
      label: <span>근태 관리</span>,
    },
    {
      key: '/stats',
      icon: <BarChartOutlined />,
      label: <span>통계 조회</span>,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 현재 경로에서 메뉴 키 찾기
  const getSelectedKey = () => {
    const path = location.pathname;
    // /sites/new, /sites/:id/edit 등도 /sites로 선택되도록
    if (path.startsWith('/sites')) return '/sites';
    if (path.startsWith('/delivery-routes')) return '/delivery-routes';
    if (path.startsWith('/delivery-logs')) return '/delivery-logs';
    if (path.startsWith('/menu-types')) return '/menu-types';
    if (path.startsWith('/weekly-menus')) return '/weekly-menus';
    if (path.startsWith('/meal-count-settings')) return '/meal-count-settings';
    if (path.startsWith('/meal-counts')) return '/meal-counts';
    if (path.startsWith('/meal-photos')) return '/meal-photos';
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
      `}</style>
    </Sider>
  );
}
