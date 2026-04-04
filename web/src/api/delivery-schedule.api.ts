import { apiClient } from '../utils/axios';

export interface DeliveryScheduleItem {
  id: string;
  routeId: string;
  driverId: string;
  dayOfWeek: number;
  mealType: string;
  route: { id: string; name: string; code: string; division: string; color: string };
  driver: { id: string; name: string; phone: string };
}

export interface DailyDriverOverrideItem {
  id: string;
  routeId: string;
  driverId: string;
  date: string;
  mealType: string;
  note?: string;
  route: { id: string; name: string; code: string; division: string; color: string };
  driver: { id: string; name: string; phone: string };
}

// 스케줄 CRUD
export async function getSchedules(params?: { routeId?: string; driverId?: string; dayOfWeek?: number }) {
  const response = await apiClient.get('/delivery-schedules', { params });
  return response.data;
}

export async function upsertSchedule(data: { routeId: string; driverId: string; dayOfWeek: number; mealType: string }) {
  const response = await apiClient.post('/delivery-schedules', data);
  return response.data;
}

export async function bulkUpsertSchedules(schedules: Array<{ routeId: string; driverId: string; dayOfWeek: number; mealType: string }>) {
  const response = await apiClient.post('/delivery-schedules/bulk', { schedules });
  return response.data;
}

export async function deleteSchedule(id: string) {
  const response = await apiClient.delete(`/delivery-schedules/${id}`);
  return response.data;
}

// 오버라이드 CRUD
export async function getOverrides(params?: { routeId?: string; driverId?: string; date?: string }) {
  const response = await apiClient.get('/delivery-schedules/overrides', { params });
  return response.data;
}

export async function upsertOverride(data: { routeId: string; driverId: string; date: string; mealType: string; note?: string }) {
  const response = await apiClient.post('/delivery-schedules/overrides', data);
  return response.data;
}

export async function deleteOverride(id: string) {
  const response = await apiClient.delete(`/delivery-schedules/overrides/${id}`);
  return response.data;
}

// 날짜별 배정 조회
export async function getAssignmentsForDate(date: string, driverId?: string) {
  const response = await apiClient.get(`/delivery-schedules/date/${date}`, { params: { driverId } });
  return response.data;
}
