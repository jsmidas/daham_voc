import { apiClient } from '../utils/axios';
import type { DeliveryLog, DeliveryLogFilter } from '../types/delivery-log';

/**
 * 배송 기록 목록 조회
 */
export async function getDeliveryLogs(params?: DeliveryLogFilter) {
  return apiClient.get<DeliveryLog[]>('/delivery-logs', { params });
}

/**
 * 배송 기록 상세 조회
 */
export async function getDeliveryLogById(id: string) {
  return apiClient.get<DeliveryLog>(`/delivery-logs/${id}`);
}

/**
 * 배송 기록 삭제
 */
export async function deleteDeliveryLog(id: string): Promise<void> {
  await apiClient.delete(`/delivery-logs/${id}`);
}
