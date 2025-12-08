/**
 * Authentication Store (Zustand)
 * @description 인증 상태 관리를 위한 Zustand 스토어
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Role 타입 정의
export type Role =
  | 'SUPER_ADMIN'
  | 'HQ_ADMIN'
  | 'YEONGNAM_ADMIN'
  | 'GROUP_MANAGER'
  | 'SITE_MANAGER'
  | 'SITE_STAFF'
  | 'DELIVERY_DRIVER'
  | 'CLIENT';

// 웹 접속 허용 역할 (관리자 및 일반 직원만)
export const WEB_ALLOWED_ROLES: Role[] = [
  'SUPER_ADMIN',
  'HQ_ADMIN',
  'YEONGNAM_ADMIN',
  'GROUP_MANAGER',
  'SITE_STAFF',
];

// 사용자 타입 정의
interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  division?: 'HQ' | 'YEONGNAM';
}

// 인증 상태 인터페이스
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Zustand 스토어 생성 (localStorage 영속화)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      // 로그인 액션
      login: (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      // 로그아웃 액션
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
    }
  )
);
