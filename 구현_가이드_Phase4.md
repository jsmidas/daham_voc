# 구현 가이드 - Phase 4: 웹 프론트엔드 (2주) ✅ 완료

> **✅ 상태**: 완료 (실제 구현 기준으로 문서 업데이트 필요)
> **⚠️ 필수 선행 작업**: Phase 1, 2, 3 완료 필수
> **📅 실제 소요**: 2주 (Week 8-9)
> **📊 실제 작업량**: ~41개 파일 (페이지 18 + API 10 + 기타)

---

## 📋 Phase 4 개요

### 주요 목표
1. **React + Vite 관리자 웹 애플리케이션** 구축
2. **Ant Design UI 컴포넌트** 적용
3. **Zustand 상태 관리** 및 **React Query 데이터 페칭**
4. **JWT 인증 시스템** 연동
5. **카카오맵 API** 연동

### 기술 스택
- **Framework**: React 18 + Vite
- **UI Library**: Ant Design
- **상태 관리**: Zustand
- **데이터 페칭**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **라우팅**: React Router v6
- **지도**: Kakao Maps API

---

## 🗂️ Phase 4 파일 맵

### 프로젝트 구조

```
web/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── api/                      [API 호출 함수들]
│   │   ├── auth.api.ts           [100-150 라인] 인증 API
│   │   ├── site.api.ts           [150-200 라인] 사업장 API
│   │   ├── menu.api.ts           [150-200 라인] 식단 API
│   │   ├── meal-photo.api.ts     [150-200 라인] 배식 사진 API
│   │   ├── feedback.api.ts       [150-200 라인] VOC API
│   │   ├── attendance.api.ts     [150-200 라인] 근태 API
│   │   └── dashboard.api.ts      [100-150 라인] 대시보드 API
│   │
│   ├── components/               [재사용 가능 컴포넌트]
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx    [150-200 라인] 메인 레이아웃
│   │   │   ├── Header.tsx        [100-150 라인] 헤더
│   │   │   └── Sidebar.tsx       [150-200 라인] 사이드바
│   │   │
│   │   ├── Map/
│   │   │   └── KakaoMap.tsx      [200-300 라인] 카카오맵 컴포넌트
│   │   │
│   │   ├── Upload/
│   │   │   └── ImageUpload.tsx   [150-200 라인] 이미지 업로드
│   │   │
│   │   └── Common/
│   │       ├── Loading.tsx       [50-80 라인] 로딩 스피너
│   │       └── ErrorBoundary.tsx [100-150 라인] 에러 바운더리
│   │
│   ├── pages/                    [페이지 컴포넌트]
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx     [200-300 라인] 로그인
│   │   │   └── LogoutPage.tsx    [50-80 라인] 로그아웃
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx [300-400 라인] 대시보드
│   │   │
│   │   ├── site/
│   │   │   ├── SiteListPage.tsx  [300-400 라인] 사업장 목록
│   │   │   ├── SiteFormPage.tsx  [300-400 라인] 사업장 등록/수정
│   │   │   └── SiteGroupPage.tsx [250-350 라인] 사업장 그룹
│   │   │
│   │   ├── map/
│   │   │   └── SiteMapPage.tsx   [350-450 라인] 사업장 지도 뷰
│   │   │
│   │   ├── menu/
│   │   │   ├── MenuListPage.tsx  [300-400 라인] 식단 목록
│   │   │   └── MenuFormPage.tsx  [300-400 라인] 식단 등록/수정
│   │   │
│   │   ├── photo/
│   │   │   └── PhotoGalleryPage.tsx [300-400 라인] 배식 사진 갤러리
│   │   │
│   │   ├── feedback/
│   │   │   └── FeedbackListPage.tsx [300-400 라인] VOC 관리
│   │   │
│   │   ├── staff/
│   │   │   └── StaffListPage.tsx [250-350 라인] 담당자 관리
│   │   │
│   │   ├── attendance/
│   │   │   └── AttendanceListPage.tsx [300-400 라인] 근태 관리
│   │   │
│   │   └── stats/
│   │       └── StatsPage.tsx     [300-400 라인] 통계 조회
│   │
│   ├── store/                    [Zustand 스토어]
│   │   ├── authStore.ts          [100-150 라인] 인증 상태
│   │   └── uiStore.ts            [80-120 라인] UI 상태
│   │
│   ├── hooks/                    [커스텀 훅]
│   │   ├── useAuth.ts            [80-120 라인] 인증 훅
│   │   ├── useSites.ts           [100-150 라인] 사업장 데이터 훅
│   │   ├── useMenus.ts           [100-150 라인] 식단 데이터 훅
│   │   └── useFeedbacks.ts       [100-150 라인] VOC 데이터 훅
│   │
│   ├── utils/
│   │   ├── axios.ts              [100-150 라인] Axios 인스턴스
│   │   ├── constants.ts          [80-120 라인] 상수 정의
│   │   └── formatters.ts         [100-150 라인] 데이터 포맷팅
│   │
│   ├── types/
│   │   ├── auth.types.ts         [50-80 라인]
│   │   ├── site.types.ts         [80-120 라인]
│   │   ├── menu.types.ts         [80-120 라인]
│   │   └── common.types.ts       [50-80 라인]
│   │
│   ├── App.tsx                   [100-150 라인] 메인 앱
│   ├── main.tsx                  [50-80 라인] 엔트리 포인트
│   └── router.tsx                [150-200 라인] 라우팅 설정
│
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🚨 중복 방지 규칙 (Phase 4)

### ❌ 절대 금지 사항
1. **Axios 인스턴스**: `utils/axios.ts`에서만 생성
2. **API 호출**: 각 `api/*.api.ts` 파일에서만 정의
3. **인증 토큰 관리**: `authStore.ts`에서만 처리
4. **공통 타입**: `types/` 폴더에서만 정의

### ✅ 올바른 사용 예시
```typescript
// ❌ 잘못된 예시 - 컴포넌트에서 직접 axios 호출
import axios from 'axios';
const response = await axios.get('/api/sites'); // ❌ 중복!

// ✅ 올바른 예시 - API 함수 활용
import { getSites } from '@/api/site.api';
const sites = await getSites(); // ✅
```

---

## 📅 Week 8: 웹 프로젝트 기본 구조

### Task 8.1: 프로젝트 생성 및 의존성 설치

**명령어**:
```bash
# Vite 프로젝트 생성
npm create vite@latest web -- --template react-ts

cd web

# 의존성 설치
npm install antd zustand @tanstack/react-query axios react-router-dom
npm install @ant-design/icons dayjs

# 개발 의존성
npm install -D @types/node
```

---

### Task 8.2: 환경 변수 설정

**파일**: `web/.env.example`
**예상 라인**: 20-30 라인

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_KAKAO_MAP_APP_KEY=your_kakao_map_key
```

**파일**: `web/.env` (생성, .gitignore에 추가)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_KAKAO_MAP_APP_KEY=실제_카카오맵_키
```

---

### Task 8.3: Vite 설정

**파일**: `web/vite.config.ts`
**예상 라인**: 30-50 라인

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

---

### Task 8.4: Axios 인스턴스 설정

**파일**: `web/src/utils/axios.ts`
**예상 라인**: 100-150 라인

```typescript
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Lines 1-30: Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lines 35-80: 요청 인터셉터 (JWT 토큰 추가)
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lines 85-150: 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // { success, data, message } 형식
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

---

### Task 8.5: Zustand 스토어 (인증)

**파일**: `web/src/store/authStore.ts`
**예상 라인**: 100-150 라인

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Lines 1-20: 타입 정의
interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  division?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Lines 25-100: 스토어 생성
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage', // localStorage 키
    }
  )
);
```

---

### Task 8.6: React Query 설정

**파일**: `web/src/main.tsx`
**예상 라인**: 50-80 라인

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import App from './App';
import './index.css';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={koKR}>
        <App />
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

### Task 8.7: 라우팅 설정

**파일**: `web/src/router.tsx`
**예상 라인**: 150-200 라인

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import MainLayout from '@/components/Layout/MainLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
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

// Lines 1-50: Protected Route 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Lines 55-200: 라우터 정의
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
```

---

### Task 8.8: MainLayout 컴포넌트

**파일**: `web/src/components/Layout/MainLayout.tsx`
**예상 라인**: 150-200 라인

```typescript
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
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

**파일**: `web/src/components/Layout/Header.tsx`
**예상 라인**: 100-150 라인

```typescript
import { Layout, Button, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const { Header: AntHeader } = Layout;

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2>Daham VOC 관리자</h2>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} />
          <span>{user?.name}</span>
        </Space>
      </Dropdown>
    </AntHeader>
  );
}
```

**파일**: `web/src/components/Layout/Sidebar.tsx`
**예상 라인**: 150-200 라인

```typescript
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

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
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

  return (
    <Sider width={200} style={{ background: '#001529' }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h3>Daham VOC</h3>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        theme="dark"
      />
    </Sider>
  );
}
```

---

### Task 8.9: 로그인 페이지

**파일**: `web/src/api/auth.api.ts`
**예상 라인**: 100-150 라인

```typescript
import { apiClient } from '@/utils/axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    division?: string;
  };
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post('/auth/login', data);
}

export async function logout(): Promise<void> {
  return apiClient.post('/auth/logout');
}
```

**파일**: `web/src/pages/auth/LoginPage.tsx`
**예상 라인**: 200-300 라인

```typescript
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      message.success('로그인 성공');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '로그인 실패');
    },
  });

  const onFinish = (values: any) => {
    loginMutation.mutate(values);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="Daham VOC 관리자 로그인" style={{ width: 400 }}>
        <Form name="login" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '이메일을 입력하세요' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="이메일" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loginMutation.isPending}>
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

---

## 📅 Week 9: 핵심 페이지 구현

### Task 9.1: 대시보드 페이지

**파일**: `web/src/api/dashboard.api.ts`
**예상 라인**: 100-150 라인

```typescript
import { apiClient } from '@/utils/axios';

export async function getDashboardSummary(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/summary', {
    params: { dateFrom, dateTo },
  });
}

export async function getSiteDetailStats(siteId: string, dateFrom: string, dateTo: string) {
  return apiClient.get(`/dashboard/site/${siteId}`, {
    params: { dateFrom, dateTo },
  });
}

export async function getStaffPerformance(userId: string, dateFrom: string, dateTo: string) {
  return apiClient.get(`/dashboard/staff/${userId}`, {
    params: { dateFrom, dateTo },
  });
}

export async function getDivisionComparison(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/division-comparison', {
    params: { dateFrom, dateTo },
  });
}
```

**파일**: `web/src/pages/dashboard/DashboardPage.tsx`
**예상 라인**: 300-400 라인

```typescript
import { Row, Col, Card, Statistic, DatePicker, Spin } from 'antd';
import {
  ShopOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/api/dashboard.api';
import { useState } from 'react';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', ...dateRange],
    queryFn: () => getDashboardSummary(dateRange[0], dateRange[1]),
  });

  const handleDateChange = (dates: any) => {
    if (dates) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]);
    }
  };

  if (isLoading) {
    return <Spin size="large" />;
  }

  return (
    <div>
      <h1>대시보드</h1>

      <RangePicker
        value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
        onChange={handleDateChange}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 사업장"
              value={summary?.data.sites.total || 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="미처리 VOC"
              value={summary?.data.feedbacks.pending || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="평균 별점"
              value={summary?.data.feedbacks.averageRating || 0}
              precision={1}
              suffix="/ 5.0"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="담당자 수"
              value={summary?.data.staff.total || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="사업장 유형별 분포">
            {/* 차트 라이브러리 사용 (예: recharts, Chart.js) */}
            <pre>{JSON.stringify(summary?.data.sites.byType, null, 2)}</pre>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="근태 현황">
            <Statistic
              title="총 출근 기록"
              value={summary?.data.attendances.total || 0}
              prefix={<ClockCircleOutlined />}
            />
            <Statistic
              title="지각률"
              value={summary?.data.attendances.lateRate || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

---

### Task 9.2: 사업장 관리 페이지

**파일**: `web/src/api/site.api.ts`
**예상 라인**: 150-200 라인

```typescript
import { apiClient } from '@/utils/axios';

export async function getSites(params?: any) {
  return apiClient.get('/sites', { params });
}

export async function getSiteById(id: string) {
  return apiClient.get(`/sites/${id}`);
}

export async function createSite(data: any) {
  return apiClient.post('/sites', data);
}

export async function updateSite(id: string, data: any) {
  return apiClient.patch(`/sites/${id}`, data);
}

export async function deleteSite(id: string) {
  return apiClient.delete(`/sites/${id}`);
}

export async function getSiteGroups() {
  return apiClient.get('/site-groups');
}

export async function createSiteGroup(data: any) {
  return apiClient.post('/site-groups', data);
}
```

**파일**: `web/src/pages/site/SiteListPage.tsx`
**예상 라인**: 300-400 라인

```typescript
import { Table, Button, Space, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSites, deleteSite } from '@/api/site.api';
import { useState } from 'react';

const { Search } = Input;

export default function SiteListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', { search, type: typeFilter }],
    queryFn: () => getSites({ search, type: typeFilter }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      message.success('사업장이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: () => {
      message.error('삭제 실패');
    },
  });

  const columns = [
    {
      title: '사업장명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '부문',
      dataIndex: 'division',
      key: 'division',
    },
    {
      title: '주소',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '작업',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/sites/${record.id}/edit`)}
          >
            수정
          </Button>
          <Popconfirm
            title="삭제하시겠습니까?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>사업장 관리</h1>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="사업장명 검색"
          onSearch={setSearch}
          style={{ width: 300 }}
        />
        <Select
          placeholder="유형 선택"
          style={{ width: 150 }}
          allowClear
          onChange={setTypeFilter}
        >
          <Select.Option value="위탁">위탁</Select.Option>
          <Select.Option value="운반급식">운반급식</Select.Option>
          <Select.Option value="도시락">도시락</Select.Option>
          <Select.Option value="행사">행사</Select.Option>
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/sites/new')}
        >
          사업장 등록
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={sites?.data || []}
        loading={isLoading}
        rowKey="id"
      />
    </div>
  );
}
```

---

### Task 9.3: 카카오맵 컴포넌트

**파일**: `web/src/components/Map/KakaoMap.tsx`
**예상 라인**: 200-300 라인

```typescript
import { useEffect, useRef } from 'react';

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
  editable?: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap({
  latitude,
  longitude,
  onLocationChange,
  editable = false,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_APP_KEY
    }&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(latitude, longitude),
          level: 3,
        };

        const map = new window.kakao.maps.Map(container, options);
        kakaoMapRef.current = map;

        // 마커 생성
        const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });

        marker.setMap(map);
        markerRef.current = marker;

        // 편집 가능한 경우 클릭 이벤트
        if (editable) {
          window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;

            // 마커 위치 변경
            marker.setPosition(latlng);

            // 콜백 호출
            if (onLocationChange) {
              onLocationChange(latlng.getLat(), latlng.getLng());
            }
          });
        }
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // latitude, longitude 변경 시 지도 중심 이동
  useEffect(() => {
    if (kakaoMapRef.current && markerRef.current) {
      const newPosition = new window.kakao.maps.LatLng(latitude, longitude);
      kakaoMapRef.current.setCenter(newPosition);
      markerRef.current.setPosition(newPosition);
    }
  }, [latitude, longitude]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
```

---

### Task 9.4: VOC 관리 페이지

**파일**: `web/src/api/feedback.api.ts`
**예상 라인**: 150-200 라인

```typescript
import { apiClient } from '@/utils/axios';

export async function getFeedbacks(params?: any) {
  return apiClient.get('/feedbacks', { params });
}

export async function respondToFeedback(id: string, data: { response: string; status: string }) {
  return apiClient.patch(`/feedbacks/${id}/respond`, data);
}

export async function getStaffRatings() {
  return apiClient.get('/feedbacks/staff-ratings');
}
```

**파일**: `web/src/pages/feedback/FeedbackListPage.tsx`
**예상 라인**: 300-400 라인

```typescript
import { Table, Tag, Button, Modal, Form, Input, Select, Rate, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeedbacks, respondToFeedback } from '@/api/feedback.api';
import { useState } from 'react';

export default function FeedbackListPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => getFeedbacks(),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, data }: any) => respondToFeedback(id, data),
    onSuccess: () => {
      message.success('답변이 등록되었습니다');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const handleRespond = (record: any) => {
    setSelectedFeedback(record);
    setIsModalOpen(true);
  };

  const onFinish = (values: any) => {
    respondMutation.mutate({
      id: selectedFeedback.id,
      data: values,
    });
  };

  const columns = [
    {
      title: '사업장',
      dataIndex: ['site', 'name'],
      key: 'site',
    },
    {
      title: '작성자',
      dataIndex: ['creator', 'name'],
      key: 'creator',
    },
    {
      title: '내용',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '별점',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Rate disabled value={rating} />,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'red',
          IN_PROGRESS: 'orange',
          RESOLVED: 'green',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: '작업',
      key: 'action',
      render: (_: any, record: any) => (
        <Button size="small" onClick={() => handleRespond(record)}>
          답변
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1>VOC 관리</h1>

      <Table
        columns={columns}
        dataSource={feedbacks?.data || []}
        loading={isLoading}
        rowKey="id"
      />

      <Modal
        title="VOC 답변"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="VOC 내용">
            <p>{selectedFeedback?.content}</p>
          </Form.Item>

          <Form.Item
            label="답변"
            name="response"
            rules={[{ required: true, message: '답변을 입력하세요' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="상태"
            name="status"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="IN_PROGRESS">처리 중</Select.Option>
              <Select.Option value="RESOLVED">완료</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={respondMutation.isPending}>
              답변 등록
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

---

### Task 9.5: 사업장 지도 뷰 페이지

**파일**: `web/src/pages/map/SiteMapPage.tsx` (신규 생성)
**예상 라인**: 350-450 라인

```typescript
import { useState, useEffect } from 'react';
import { Select, Card, Spin, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getSites } from '@/api/site.api';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function SiteMapPage() {
  const [division, setDivision] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();

  // 사업장 목록 조회
  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', { division, type }],
    queryFn: () => getSites({ division, type }),
  });

  // 카카오맵 초기화 및 마커 표시
  useEffect(() => {
    if (!sites?.data || sites.data.length === 0) return;

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_APP_KEY
    }&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');

        // 첫 번째 사업장 좌표를 중심으로 설정
        const firstSite = sites.data[0];
        const options = {
          center: new window.kakao.maps.LatLng(firstSite.latitude, firstSite.longitude),
          level: 8, // 확대 레벨 (높을수록 넓은 지역)
        };

        const map = new window.kakao.maps.Map(container, options);

        // 모든 사업장에 마커 표시
        sites.data.forEach((site: any) => {
          const markerPosition = new window.kakao.maps.LatLng(
            site.latitude,
            site.longitude
          );

          // 사업장 유형별 마커 색상 구분
          const markerImage = getMarkerImageBySiteType(site.type);

          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            title: site.name,
            image: markerImage,
          });

          marker.setMap(map);

          // 마커 클릭 시 정보 팝업
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:15px;min-width:250px;font-family:sans-serif;">
                <h4 style="margin:0 0 8px 0;font-size:16px;font-weight:bold;">
                  ${site.name}
                </h4>
                <div style="margin-bottom:8px;">
                  <span style="display:inline-block;padding:2px 8px;background:#1890ff;color:white;border-radius:4px;font-size:12px;margin-right:4px;">
                    ${site.type}
                  </span>
                  <span style="display:inline-block;padding:2px 8px;background:#52c41a;color:white;border-radius:4px;font-size:12px;">
                    ${site.division}
                  </span>
                </div>
                <p style="margin:0;font-size:13px;color:#666;line-height:1.5;">
                  📍 ${site.address}
                </p>
                ${site.staffSites && site.staffSites.length > 0 ? `
                  <p style="margin:8px 0 0 0;font-size:12px;color:#888;">
                    👤 담당자: ${site.staffSites.map((ss: any) => ss.staff.user.name).join(', ')}
                  </p>
                ` : ''}
              </div>
            `,
          });

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', () => {
            infowindow.open(map, marker);
          });

          // 마커에 호버 효과 (선택 사항)
          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            marker.setOpacity(0.7);
          });

          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            marker.setOpacity(1);
          });
        });

        // 모든 마커가 보이도록 지도 범위 조정
        const bounds = new window.kakao.maps.LatLngBounds();
        sites.data.forEach((site: any) => {
          bounds.extend(
            new window.kakao.maps.LatLng(site.latitude, site.longitude)
          );
        });
        map.setBounds(bounds);

        // 지도 확대/축소 제한 설정
        map.setMaxLevel(10);
        map.setMinLevel(1);
      });
    };

    document.head.appendChild(script);

    return () => {
      // 스크립트 중복 방지를 위한 정리
      const existingScript = document.querySelector(
        `script[src*="dapi.kakao.com"]`
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [sites]);

  // 사업장 유형별 마커 이미지 생성
  const getMarkerImageBySiteType = (type: string) => {
    const colors: Record<string, string> = {
      '위탁': '#ff4d4f',
      '운반급식': '#1890ff',
      '도시락': '#52c41a',
      '행사': '#faad14',
    };

    const color = colors[type] || '#000000';

    // 커스텀 마커 이미지 (SVG를 사용한 원형 마커)
    const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path fill="${color}" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
        <circle fill="white" cx="16" cy="16" r="6"/>
      </svg>
    `)}`;

    const imageSize = new window.kakao.maps.Size(32, 40);
    const imageOption = { offset: new window.kakao.maps.Point(16, 40) };

    return new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="사업장 정보를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div>
      <h1>사업장 지도</h1>

      {/* 필터 및 통계 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <label style={{ marginRight: 8, fontWeight: 'bold' }}>부문:</label>
            <Select
              placeholder="전체"
              style={{ width: 150 }}
              allowClear
              onChange={setDivision}
              value={division}
            >
              <Select.Option value="본사">본사</Select.Option>
              <Select.Option value="영남지사">영남지사</Select.Option>
            </Select>
          </div>

          <div>
            <label style={{ marginRight: 8, fontWeight: 'bold' }}>유형:</label>
            <Select
              placeholder="전체"
              style={{ width: 150 }}
              allowClear
              onChange={setType}
              value={type}
            >
              <Select.Option value="위탁">위탁</Select.Option>
              <Select.Option value="운반급식">운반급식</Select.Option>
              <Select.Option value="도시락">도시락</Select.Option>
              <Select.Option value="행사">행사</Select.Option>
            </Select>
          </div>

          <div>
            <span style={{ fontWeight: 'bold' }}>총 사업장: </span>
            <span style={{ fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>
              {sites?.data?.length || 0}개
            </span>
          </div>
        </Space>

        {/* 범례 */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ marginRight: 16, fontWeight: 'bold' }}>마커 색상:</span>
          <Space>
            <Tag color="red">위탁</Tag>
            <Tag color="blue">운반급식</Tag>
            <Tag color="green">도시락</Tag>
            <Tag color="orange">행사</Tag>
          </Space>
        </div>
      </Card>

      {/* 지도 */}
      <Card>
        <div
          id="map"
          style={{
            width: '100%',
            height: '700px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </Card>

      {/* 안내 메시지 */}
      <Card style={{ marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <p style={{ margin: 0, color: '#52c41a' }}>
          💡 <strong>사용 팁:</strong> 마커를 클릭하면 사업장 상세 정보를 확인할 수 있습니다.
          지도를 드래그하거나 마우스 휠로 확대/축소할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
```

**구현 특징**:
1. **여러 사업장 동시 표시**: 필터 조건에 맞는 모든 사업장을 지도에 마커로 표시
2. **유형별 마커 색상**: 위탁(빨강), 운반급식(파랑), 도시락(초록), 행사(주황)
3. **정보 팝업**: 마커 클릭 시 사업장명, 유형, 부문, 주소, 담당자 표시
4. **자동 범위 조정**: 모든 마커가 보이도록 지도 범위 자동 조정
5. **필터링**: 부문별, 유형별 실시간 필터링
6. **반응형 마커**: 마우스 호버 시 투명도 효과

---

## ✅ Phase 4 완료 체크리스트

### Week 8: 웹 프로젝트 기본 구조 (9개 작업)
- [ ] Task 8.1: 프로젝트 생성 및 의존성 설치
- [ ] Task 8.2: 환경 변수 설정
- [ ] Task 8.3: Vite 설정
- [ ] Task 8.4: Axios 인스턴스 설정
- [ ] Task 8.5: Zustand 스토어 (인증)
- [ ] Task 8.6: React Query 설정
- [ ] Task 8.7: 라우팅 설정
- [ ] Task 8.8: MainLayout 컴포넌트
- [ ] Task 8.9: 로그인 페이지

### Week 9: 핵심 페이지 (5개 작업)
- [ ] Task 9.1: 대시보드 페이지
- [ ] Task 9.2: 사업장 관리 페이지
- [ ] Task 9.3: 카카오맵 컴포넌트
- [ ] Task 9.4: VOC 관리 페이지
- [ ] Task 9.5: 사업장 지도 뷰 페이지

### 추가 구현 필요 페이지 (가이드 생략, 유사 패턴)
- [ ] 식단 관리 페이지
- [ ] 배식 사진 갤러리
- [ ] 담당자 관리 페이지
- [ ] 근태 관리 페이지
- [ ] 통계 조회 페이지

### 통합 테스트
- [ ] 로그인/로그아웃 테스트
- [ ] 토큰 인증 동작 확인
- [ ] 페이지 네비게이션 확인
- [ ] API 연동 확인
- [ ] 카카오맵 표시 확인 (단일 사업장)
- [ ] 사업장 지도 뷰 확인 (여러 사업장 동시 표시)
- [ ] 지도 마커 클릭 시 정보 팝업 확인
- [ ] 부문/유형별 필터링 확인

---

## 📝 Agent 인계 템플릿

```
=== Phase 4 완료 보고 ===

완료한 작업:
- Week 8: React 웹 프로젝트 기본 구조
- Week 9: 핵심 페이지 구현 (대시보드, 사업장, VOC 등)

생성된 주요 파일:
1. web/src/utils/axios.ts - Axios 인스턴스 및 인터셉터
2. web/src/store/authStore.ts - Zustand 인증 스토어
3. web/src/router.tsx - React Router 설정
4. web/src/components/Layout/ - MainLayout, Header, Sidebar
5. web/src/pages/* - 각종 페이지 컴포넌트
6. web/src/api/* - API 호출 함수들

테스트 완료:
- [x] 로그인/로그아웃
- [x] JWT 토큰 인증
- [x] 대시보드 표시
- [x] 사업장 CRUD
- [x] 사업장 지도 뷰 (여러 사업장 동시 표시)
- [x] VOC 관리

주의사항:
- 카카오맵 API 키 필요
- Ant Design 한글 locale 적용됨
- React Query 캐싱: 5분

다음 단계:
- Phase 5 (모바일 앱) 진행
```

---

## 📌 다음 Phase 안내

**Phase 5**: 모바일 앱 (3주)
- Week 10: React Native 기본 구조
- Week 11: 모바일 핵심 기능
- Week 12: 오프라인 모드 & 최적화

**파일**: `구현_가이드_Phase5.md` 참조

---

## 📊 Phase 4 실제 구현 상태 (2025-10-12 기준)

### ✅ 완료된 기능

**페이지 (18개):**
```
web/src/pages/
├── auth/
│   ├── LoginPage.tsx ✅
│   └── ChangePasswordPage.tsx ✅ (추가 구현)
├── attendance/
│   └── AttendanceListPage.tsx ✅
├── dashboard/
│   └── DashboardPage.tsx ✅
├── feedback/
│   └── FeedbackListPage.tsx ✅
├── map/
│   └── SiteMapPage.tsx ✅
├── meal-photo/
│   └── MealPhotoManagementPage.tsx ✅ (추가 구현)
├── menu/
│   ├── MenuListPage.tsx ✅
│   ├── MenuFormPage.tsx ✅
│   └── WeeklyMenuPage.tsx ✅ (추가 구현)
├── menu-type/
│   └── MenuTypePage.tsx ✅ (추가 구현)
├── photo/
│   └── PhotoGalleryPage.tsx ✅
├── site/
│   ├── SiteListPage.tsx ✅
│   ├── SiteFormPage.tsx ✅
│   └── SiteGroupPage.tsx ✅
├── staff/
│   ├── StaffListPage.tsx ✅
│   └── StaffFormPage.tsx ✅ (추가 구현)
└── stats/
    └── StatsPage.tsx ✅
```

**API 파일 (10개):**
```
web/src/api/
├── attendance.api.ts ✅
├── auth.api.ts ✅
├── dashboard.api.ts ✅
├── feedback.api.ts ✅
├── meal-photo.api.ts ✅ (추가 구현)
├── menu-type.api.ts ✅ (추가 구현, menu.api.ts 대신)
├── site-group.api.ts ✅
├── site.api.ts ✅
├── staff.api.ts ✅
└── weekly-menu-template.api.ts ✅ (추가 구현)
```

**컴포넌트:**
```
web/src/components/
├── AddressSearch.tsx ✅ (추가 구현 - 주소 검색)
├── Common/ ✅
├── Layout/ ✅ (MainLayout, Header, Sidebar)
├── Map/ ✅ (KakaoMap)
└── Upload/ ✅ (ImageUpload)
```

### ⚠️ 가이드와 다른 부분

| 항목 | 가이드 명세 | 실제 구현 | 영향도 |
|------|-----------|----------|--------|
| 비밀번호 변경 | ❌ 없음 | ✅ ChangePasswordPage | 🟢 추가 기능 |
| 배식사진 관리 | PhotoGalleryPage | **MealPhotoManagementPage** | 🟡 이름 변경 |
| 식단 API | menu.api.ts | **menu-type.api.ts** + weekly-menu-template.api.ts | 🟡 분리됨 |
| 메뉴 타입 관리 | ❌ 없음 | ✅ MenuTypePage | 🟢 추가 기능 |
| 주간 식단표 | ❌ 없음 | ✅ WeeklyMenuPage | 🟢 추가 기능 |
| 담당자 등록 | ❌ 없음 | ✅ StaffFormPage | 🟢 추가 기능 |
| 주소 검색 | ❌ 없음 | ✅ AddressSearch 컴포넌트 | 🟢 추가 기능 |

### 📁 실제 생성된 파일 구조

**핵심 설정 파일:**
- ✅ `vite.config.ts` - Vite 설정
- ✅ `tsconfig.json` - TypeScript 설정
- ✅ `.env` - 환경 변수 (VITE_API_BASE_URL 등)

**유틸리티 & 스토어:**
- ✅ `src/utils/axios.ts` - Axios 인스턴스 및 인터셉터
- ✅ `src/store/authStore.ts` - Zustand 인증 스토어
- ✅ `src/router.tsx` - React Router 설정

### 💡 주요 구현 특징

1. **주소 검색 기능 추가**: Kakao Maps API를 활용한 주소 검색 컴포넌트
2. **메뉴 관리 강화**: 메뉴 타입 관리 페이지 + 주간 식단표 페이지 추가
3. **배식사진 관리 강화**: MealPhotoManagementPage로 통합 관리
4. **담당자 등록/수정**: StaffFormPage 추가
5. **비밀번호 변경**: ChangePasswordPage 추가

### 🎯 체크리스트 업데이트

### Week 8: 웹 프로젝트 기본 구조 (9개 작업)
- [x] Task 8.1: 프로젝트 생성 및 의존성 설치 ✅
- [x] Task 8.2: 환경 변수 설정 ✅
- [x] Task 8.3: Vite 설정 ✅
- [x] Task 8.4: Axios 인스턴스 설정 ✅
- [x] Task 8.5: Zustand 스토어 (인증) ✅
- [x] Task 8.6: React Query 설정 ✅
- [x] Task 8.7: 라우팅 설정 ✅
- [x] Task 8.8: MainLayout 컴포넌트 ✅
- [x] Task 8.9: 로그인 페이지 ✅

### Week 9: 핵심 페이지 (5개 + 추가 구현)
- [x] Task 9.1: 대시보드 페이지 ✅
- [x] Task 9.2: 사업장 관리 페이지 ✅
- [x] Task 9.3: 카카오맵 컴포넌트 ✅
- [x] Task 9.4: VOC 관리 페이지 ✅
- [x] Task 9.5: 사업장 지도 뷰 페이지 ✅
- [x] **추가**: 식단 관리 페이지 (MenuListPage, MenuFormPage) ✅
- [x] **추가**: 주간 식단표 페이지 (WeeklyMenuPage) ✅
- [x] **추가**: 메뉴 타입 관리 (MenuTypePage) ✅
- [x] **추가**: 배식 사진 관리 (MealPhotoManagementPage) ✅
- [x] **추가**: 담당자 관리 (StaffListPage, StaffFormPage) ✅
- [x] **추가**: 근태 관리 (AttendanceListPage) ✅
- [x] **추가**: 통계 조회 (StatsPage) ✅
- [x] **추가**: 비밀번호 변경 (ChangePasswordPage) ✅

### 통합 테스트
- [x] 로그인/로그아웃 테스트 ✅
- [x] 토큰 인증 동작 확인 ✅
- [x] 페이지 네비게이션 확인 ✅
- [x] API 연동 확인 ✅
- [x] 카카오맵 표시 확인 (단일 사업장) ✅
- [x] 사업장 지도 뷰 확인 (여러 사업장 동시 표시) ✅
- [x] 주소 검색 기능 확인 ✅

### 📝 참고

**실제 작업량:**
- 페이지: 18개 (가이드 예상 15개보다 많음)
- API: 10개 (가이드 예상 7개보다 많음)
- 추가 구현: 비밀번호 변경, 메뉴 타입 관리, 주간 식단표, 배식사진 관리 강화, 주소 검색

**다음 작업:**
1. ✅ Phase 4 가이드 실제 구현 기준 업데이트 완료
2. ⏭️ Phase 5 (모바일 앱) 가이드 확인 필요
3. ⏭️ Phase 6 (배포 및 운영) 가이드 확인 필요
