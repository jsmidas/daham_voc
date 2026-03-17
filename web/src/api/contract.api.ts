/**
 * Contract API
 * @description 전자 근로계약서 관련 API
 */

import { apiClient } from '@/utils/axios';

// 계약서 목록 조회
export async function getContracts(params?: any) {
  return apiClient.get('/contracts', { params });
}

// 계약서 상세 조회
export async function getContractById(id: string) {
  return apiClient.get(`/contracts/${id}`);
}

// 계약서 생성 (페이지 이미지 업로드)
export async function createContract(data: {
  title: string;
  description?: string;
  pages: File[];
}) {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  data.pages.forEach((file) => formData.append('pages', file));

  return apiClient.post('/contracts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

// 대상자 배정
export async function assignContract(contractId: string, data: {
  userIds: string[];
  expiresAt?: string;
}) {
  return apiClient.post(`/contracts/${contractId}/assign`, data);
}

// 서명 현황 조회
export async function getContractStatus(contractId: string) {
  return apiClient.get(`/contracts/${contractId}/status`);
}

// 계약서 삭제
export async function deleteContract(id: string) {
  return apiClient.delete(`/contracts/${id}`);
}

// 배정 취소
export async function removeAssignment(assignmentId: string) {
  return apiClient.delete(`/contracts/assignments/${assignmentId}`);
}

// 서명 영역 전체 교체
export async function replaceSignZones(contractId: string, zones: {
  label: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sortOrder: number;
}[]) {
  return apiClient.put(`/contracts/${contractId}/sign-zones`, { zones });
}

// 계약 대상자 목록 조회
export async function getContractTargets() {
  return apiClient.get('/contracts/targets');
}

// 여러 계약서 일괄 배정
export async function assignMultipleContracts(data: {
  contractIds: string[];
  userIds: string[];
  expiresAt?: string;
}) {
  return apiClient.post('/contracts/assign-bulk', data);
}
