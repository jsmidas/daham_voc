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
      label: '대시보드',
    },
    {
      key: '/sites',
      icon: <ShopOutlined />,
      label: '사업장 관리',
    },
    {
      key: '/site-groups',
      icon: <ShopOutlined />,
      label: '사업장 그룹',
    },
    {
      key: '/map',
      icon: <EnvironmentOutlined />,
      label: '사업장 지도',
    },
    {
      key: '/menus',
      icon: <CalendarOutlined />,
      label: '식단 관리',
    },
    {
      key: '/photos',
      icon: <CameraOutlined />,
      label: '배식 사진',
    },
    {
      key: '/feedbacks',
      icon: <MessageOutlined />,
      label: 'VOC 관리',
    },
    {
      key: '/staff',
      icon: <TeamOutlined />,
      label: '담당자 관리',
    },
    {
      key: '/attendances',
      icon: <ClockCircleOutlined />,
      label: '근태 관리',
    },
    {
      key: '/stats',
      icon: <BarChartOutlined />,
      label: '통계 조회',
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
    if (path.startsWith('/menus')) return '/menus';
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
    </Sider>
  );
}
