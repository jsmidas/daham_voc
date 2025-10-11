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
  return apiClient.get<{ groups: SiteGroup[] }>('/site-groups', { params });
}

/**
 * Get site group by ID
 */
export async function getSiteGroupById(id: string) {
  return apiClient.get<{ group: SiteGroup }>(`/site-groups/${id}`);
}

/**
 * Create site group
 */
export async function createSiteGroup(data: CreateSiteGroupDto) {
  return apiClient.post<{ group: SiteGroup }>('/site-groups', data);
}

/**
 * Update site group
 */
export async function updateSiteGroup(id: string, data: UpdateSiteGroupDto) {
  return apiClient.put<{ group: SiteGroup }>(`/site-groups/${id}`, data);
}

/**
 * Delete site group
 */
export async function deleteSiteGroup(id: string) {
  return apiClient.delete(`/site-groups/${id}`);
}

/**
 * Add sites to group
 */
export async function addSitesToGroup(groupId: string, siteIds: string[]) {
  return apiClient.post(`/site-groups/${groupId}/sites`, { siteIds });
}

/**
 * Remove sites from group
 */
export async function removeSitesFromGroup(groupId: string, siteIds: string[]) {
  return apiClient.delete(`/site-groups/${groupId}/sites`, { data: { siteIds } });
}
