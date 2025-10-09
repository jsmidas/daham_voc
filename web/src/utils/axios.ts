/**
 * Axios Instance Configuration
 * @description API 호출을 위한 Axios 인스턴스 및 인터셉터 설정
 */

import axios from 'axios';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - JWT 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 데이터 추출
apiClient.interceptors.response.use(
  (response) => {
    // 백엔드 응답 형식: { success: true, data: {...}, message: '...' }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // 에러 메시지 추출
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);
