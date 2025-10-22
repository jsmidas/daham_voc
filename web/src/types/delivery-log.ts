export type DeliveryStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'DELAYED'
  | 'ISSUE';

export interface DeliveryLog {
  id: string;
  routeId: string;
  siteId: string;
  driverId: string;
  deliveryDate: string;
  stopNumber: number;
  status: DeliveryStatus;

  // GPS 좌표
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;

  // 시간 정보
  arrivedAt?: string;
  departedAt?: string;
  estimatedArrivalTime?: string;
  actualDuration?: number; // 분 단위

  // 거리
  distanceKm?: number;

  // 기타
  note?: string;
  issueReported: boolean;
  issueDetail?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  route?: {
    id: string;
    name: string;
    division: string;
  };
  site?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface DeliveryLogFilter {
  routeId?: string;
  siteId?: string;
  driverId?: string;
  deliveryDate?: string;
  status?: DeliveryStatus;
}

export interface DeliveryLogStats {
  totalLogs: number;
  completedLogs: number;
  pendingLogs: number;
  delayedLogs: number;
  issueLogs: number;
  totalDistance: number;
  totalDuration: number;
  averageDuration: number;
}
