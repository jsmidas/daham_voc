/**
 * Main Layout
 * @description 메인 레이아웃 컴포넌트
 */

import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = Layout;

export default function MainLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content
          style={{
            margin: '24px 32px',
            padding: 32,
            background: '#fff',
            minHeight: 280,
            maxWidth: '1600px',
            width: '100%',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
