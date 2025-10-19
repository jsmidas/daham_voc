/**
 * Site Group API
 */
import apiClient from '@/utils/apiClient';

export type MarkerShape =
  | 'CIRCLE'
  | 'SQUARE'
  | 'DIAMOND'
  | 'HEART'
  | 'SPADE'
  | 'CLUB'
  | 'STAR'
  | 'TRIANGLE';

export interface SiteGroup {
  id: string;
  name: string;
  division: 'HQ' | 'YEONGNAM';
  description?: string;
  markerShape: MarkerShape;
  markerColor: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sites?: any[];
  _count?: {
    sites: number;
  };
}

export interface CreateSiteGroupDto {
  name: string;
  division: 'HQ' | 'YEONGNAM';
  description?: string;
  markerShape?: MarkerShape;
  markerColor?: string;
  sortOrder?: number;
}

export interface UpdateSiteGroupDto {
  name?: string;
  division?: 'HQ' | 'YEONGNAM';
  description?: string;
  markerShape?: MarkerShape;
  markerColor?: string;
  sortOrder?: number;
}

// Hierarchy types
export interface SiteInHierarchy {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  division?: string;
}

export interface GroupInHierarchy {
  id: string;
  name: string;
  markerShape: MarkerShape;
  markerColor: string;
  description?: string;
  sortOrder: number;
  sites: SiteInHierarchy[];
}

export interface DivisionInHierarchy {
  code: 'HQ' | 'YEONGNAM' | 'CONSIGNMENT';
  name: string;
  groups?: GroupInHierarchy[];
  sites?: SiteInHierarchy[];
}

export interface SiteHierarchy {
  company: string;
  divisions: DivisionInHierarchy[];
}

/**
 * Get hierarchy structure (다함푸드 > 본사/영남 > 그룹 > 사업장)
 */
export async function getSiteHierarchy() {
  const response = await apiClient.get<{ data: SiteHierarchy }>('/site-groups/hierarchy');
  return response.data.data;
}

/**
 * Get all site groups
 */
export async function getSiteGroups(division?: 'HQ' | 'YEONGNAM') {
  const params = division ? { division } : {};
  const response = await apiClient.get<{ success: boolean; data: { groups: SiteGroup[] } }>('/site-groups', { params });
  return response.data.data;
}

/**
 * Get site group by ID
 */
export async function getSiteGroupById(id: string) {
  const response = await apiClient.get<{ group: SiteGroup }>(`/site-groups/${id}`);
  return response.data;
}

/**
 * Create site group
 */
export async function createSiteGroup(data: CreateSiteGroupDto) {
  const response = await apiClient.post<{ group: SiteGroup }>('/site-groups', data);
  return response.data;
}

/**
 * Update site group
 */
export async function updateSiteGroup(id: string, data: UpdateSiteGroupDto) {
  const response = await apiClient.put<{ group: SiteGroup }>(`/site-groups/${id}`, data);
  return response.data;
}

/**
 * Delete site group
 */
export async function deleteSiteGroup(id: string) {
  const response = await apiClient.delete(`/site-groups/${id}`);
  return response.data;
}

/**
 * Add sites to group
 */
export async function addSitesToGroup(groupId: string, siteIds: string[]) {
  const response = await apiClient.post(`/site-groups/${groupId}/sites`, { siteIds });
  return response.data;
}

/**
 * Remove sites from group
 */
export async function removeSitesFromGroup(groupId: string, siteIds: string[]) {
  const response = await apiClient.delete(`/site-groups/${groupId}/sites`, { data: { siteIds } });
  return response.data;
}
