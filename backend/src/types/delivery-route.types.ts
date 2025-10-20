import { DeliveryStatus } from '@prisma/client';

/**
 * 배송 코스 생성 요청
 */
export interface CreateDeliveryRouteDto {
  name: string;           // "A코스"
  code: string;           // "A"
  division: 'HQ' | 'YEONGNAM';
  description?: string;
  color?: string;
}

/**
 * 배송 코스 업데이트 요청
 */
export interface UpdateDeliveryRouteDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

/**
 * 코스에 사업장 추가 요청
 */
export interface AddSiteToRouteDto {
  siteId: string;
  stopNumber: number;
  estimatedArrival?: string;  // "09:30"
  estimatedDuration?: number;
  notes?: string;
}

/**
 * 코스 사업장 순서 업데이트
 */
export interface UpdateRouteStopsDto {
  stops: Array<{
    id: string;
    stopNumber: number;
  }>;
}

/**
 * 기사 배정 요청
 */
export interface AssignDriverDto {
  routeId: string;
  driverIds: string[];
}

/**
 * 배송 기록 생성
 */
export interface CreateDeliveryLogDto {
  routeId: string;
  siteId: string;
  stopNumber: number;
  arrivedAt?: Date;
  arrivalLat?: number;
  arrivalLng?: number;
  status: DeliveryStatus;
  note?: string;
}

/**
 * 배송 코스 응답
 */
export interface DeliveryRouteResponse {
  id: string;
  name: string;
  code: string;
  division: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stopsCount: number;
  assignedDrivers: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
}

/**
 * 코스 상세 (사업장 포함)
 */
export interface DeliveryRouteDetailResponse extends DeliveryRouteResponse {
  stops: Array<{
    id: string;
    stopNumber: number;
    estimatedArrival?: string;
    estimatedDuration?: number;
    notes?: string;
    site: {
      id: string;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      type: string;
    };
  }>;
}
