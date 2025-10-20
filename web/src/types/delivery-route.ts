export type Division = 'HQ' | 'YEONGNAM';
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED' | 'DELAYED' | 'ISSUE';

export interface DeliveryRoute {
  id: string;
  name: string;
  code: string;
  division: Division;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stopsCount: number;
  assignedDrivers: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
}

export interface DeliveryRouteDetail extends DeliveryRoute {
  stops: DeliveryRouteStop[];
}

export interface DeliveryRouteStop {
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
}

export interface CreateDeliveryRouteDto {
  name: string;
  code: string;
  division: Division;
  description?: string;
  color?: string;
}

export interface UpdateDeliveryRouteDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface AddSiteToRouteDto {
  siteId: string;
  stopNumber: number;
  estimatedArrival?: string;
  estimatedDuration?: number;
  notes?: string;
}
