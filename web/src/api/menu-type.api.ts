import apiClient from '@/utils/apiClient';

export type Division = 'HQ' | 'YEONGNAM';

export interface MenuType {
  id: string;
  name: string;
  division: Division;
  description?: string;
  price?: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    siteMenuTypes: number;
  };
}

export interface CreateMenuTypeDto {
  name: string;
  division: Division;
  description?: string;
  price?: number;
  sortOrder?: number;
}

export interface UpdateMenuTypeDto {
  name?: string;
  division?: Division;
  description?: string;
  price?: number;
  sortOrder?: number;
}

/**
 * Get all menu types
 */
export async function getMenuTypes() {
  const response = await apiClient.get<{ data: { menuTypes: MenuType[] } }>('/menu-types');
  return response.data.data;
}

/**
 * Get menu type by ID
 */
export async function getMenuTypeById(id: string) {
  const response = await apiClient.get<{ data: MenuType }>(`/menu-types/${id}`);
  return response.data.data;
}

/**
 * Create menu type
 */
export async function createMenuType(data: CreateMenuTypeDto) {
  const response = await apiClient.post<{ data: MenuType }>('/menu-types', data);
  return response.data.data;
}

/**
 * Update menu type
 */
export async function updateMenuType(id: string, data: UpdateMenuTypeDto) {
  const response = await apiClient.put<{ data: MenuType }>(`/menu-types/${id}`, data);
  return response.data.data;
}

/**
 * Delete menu type
 */
export async function deleteMenuType(id: string) {
  const response = await apiClient.delete(`/menu-types/${id}`);
  return response.data;
}
