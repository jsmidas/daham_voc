import { apiClient } from '../utils/axios';
import type {
  DeliveryRoute,
  DeliveryRouteDetail,
  CreateDeliveryRouteDto,
  UpdateDeliveryRouteDto,
  AddSiteToRouteDto,
} from '../types/delivery-route';

/**
 * 배송 코스 목록 조회
 */
export async function getDeliveryRoutes(params?: {
  division?: string;
  isActive?: boolean;
  search?: string;
}) {
  return apiClient.get('/delivery-routes', { params });
}

/**
 * 배송 코스 상세 조회
 */
export async function getDeliveryRouteById(id: string) {
  return apiClient.get(`/delivery-routes/${id}`);
}

/**
 * 배송 코스 생성
 */
export async function createDeliveryRoute(data: CreateDeliveryRouteDto): Promise<DeliveryRoute> {
  const response: any = await apiClient.post('/delivery-routes', data);
  return response.data;
}

/**
 * 배송 코스 수정
 */
export async function updateDeliveryRoute(
  id: string,
  data: UpdateDeliveryRouteDto
): Promise<DeliveryRoute> {
  const response: any = await apiClient.patch(`/delivery-routes/${id}`, data);
  return response.data;
}

/**
 * 배송 코스 삭제
 */
export async function deleteDeliveryRoute(id: string): Promise<void> {
  await apiClient.delete(`/delivery-routes/${id}`);
}

/**
 * 코스에 사업장 추가
 */
export async function addSiteToRoute(routeId: string, data: AddSiteToRouteDto): Promise<void> {
  await apiClient.post(`/delivery-routes/${routeId}/stops`, data);
}

/**
 * 코스에서 사업장 제거
 */
export async function removeSiteFromRoute(routeId: string, siteId: string): Promise<void> {
  await apiClient.delete(`/delivery-routes/${routeId}/stops/${siteId}`);
}

/**
 * 코스 사업장 순서 변경
 */
export async function updateRouteStops(
  routeId: string,
  data: { stops: Array<{ id: string; stopNumber: number }> }
): Promise<void> {
  await apiClient.put(`/delivery-routes/${routeId}/stops/reorder`, data);
}

/**
 * 기사 배정
 */
export async function assignDrivers(routeId: string, driverIds: string[]): Promise<void> {
  await apiClient.post(`/delivery-routes/${routeId}/assign-drivers`, { driverIds });
}
