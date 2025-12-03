/**
 * Site API
 * @description 사업장 관련 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

// 사업장 목록 조회 (전체 데이터 - 관계 포함)
export async function getSites(params?: any) {
  return apiClient.get('/sites', { params });
}

// 사업장 목록 조회 (경량 버전 - 드롭다운, 선택박스용)
export async function getSitesLight(params?: { division?: string; isActive?: boolean }) {
  return apiClient.get('/sites/light', { params });
}

// 사업장 상세 조회
export async function getSiteById(id: string) {
  return apiClient.get(`/sites/${id}`);
}

// 사업장 생성
export async function createSite(data: any) {
  return apiClient.post('/sites', data);
}

// 사업장 수정
export async function updateSite(id: string, data: any) {
  return apiClient.put(`/sites/${id}`, data);
}

// 사업장 삭제
export async function deleteSite(id: string) {
  return apiClient.delete(`/sites/${id}`);
}

// 사업장 그룹 목록 조회
export async function getSiteGroups() {
  return apiClient.get('/site-groups');
}

// 사업장 그룹 생성
export async function createSiteGroup(data: any) {
  return apiClient.post('/site-groups', data);
}

// 엑셀 템플릿 다운로드
export async function downloadExcelTemplate() {
  try {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

    const response = await fetch(`${baseURL}/sites/excel-template`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error('템플릿 다운로드에 실패했습니다');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `사업장_등록_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel template download error:', error);
    throw error;
  }
}

// 엑셀 파일 업로드 (일괄 등록)
export async function uploadExcelFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  // axios 인스턴스의 기본 'application/json' Content-Type을 제거하고
  // axios가 FormData에 맞는 multipart/form-data를 자동 설정하도록 함
  return apiClient.post('/sites/excel-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// 배송 코스에 배정되지 않은 사업장 조회
export async function getUnassignedSites() {
  return apiClient.get("/sites/unassigned");
}
