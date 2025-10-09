/**
 * Authentication API
 * @description 인증 관련 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

// 로그인 요청 타입
export interface LoginRequest {
  phone: string;
  password: string;
}

// 비밀번호 변경 요청 타입
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// 로그인 응답 타입
export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: 'SUPER_ADMIN' | 'HQ_ADMIN' | 'YEONGNAM_ADMIN' | 'STAFF' | 'CLIENT';
      division?: 'HQ' | 'YEONGNAM';
    };
  };
  message: string;
}

// 로그인 API
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post('/auth/login', data);
}

// 로그아웃 API
export async function logout(): Promise<void> {
  return apiClient.post('/auth/logout');
}

// 비밀번호 변경 API
export async function changePassword(data: ChangePasswordRequest): Promise<any> {
  return apiClient.put('/auth/password', data);
}
