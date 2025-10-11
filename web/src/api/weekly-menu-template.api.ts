import apiClient from '@/utils/apiClient';

export interface WeeklyMenuTemplate {
  id: string;
  menuTypeId: string;
  year: number;
  weekNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  menuType: {
    id: string;
    name: string;
    description?: string;
    price?: number;
  };
}

export interface CreateWeeklyMenuTemplateDto {
  menuTypeId: string;
  year: number;
  weekNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface UpdateWeeklyMenuTemplateDto {
  imageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
}

/**
 * Get all weekly menu templates with optional filters
 */
export async function getWeeklyMenuTemplates(filters?: {
  menuTypeId?: string;
  year?: number;
  weekNumber?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.menuTypeId) params.append('menuTypeId', filters.menuTypeId);
  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString());

  const response = await apiClient.get<{ data: { templates: WeeklyMenuTemplate[] } }>(
    `/weekly-menu-templates${params.toString() ? '?' + params.toString() : ''}`
  );
  return response.data.data;
}

/**
 * Get weekly menu template by ID
 */
export async function getWeeklyMenuTemplateById(id: string) {
  const response = await apiClient.get<{ data: WeeklyMenuTemplate }>(
    `/weekly-menu-templates/${id}`
  );
  return response.data.data;
}

/**
 * Get weekly menu template by year and week
 */
export async function getWeeklyMenuTemplateByYearWeek(
  menuTypeId: string,
  year: number,
  weekNumber: number
) {
  const response = await apiClient.get<{ data: WeeklyMenuTemplate | null }>(
    `/weekly-menu-templates/by-year-week?menuTypeId=${menuTypeId}&year=${year}&weekNumber=${weekNumber}`
  );
  return response.data.data;
}

/**
 * Create weekly menu template
 */
export async function createWeeklyMenuTemplate(data: CreateWeeklyMenuTemplateDto) {
  const response = await apiClient.post<{ data: WeeklyMenuTemplate }>(
    '/weekly-menu-templates',
    data
  );
  return response.data.data;
}

/**
 * Update weekly menu template
 */
export async function updateWeeklyMenuTemplate(
  id: string,
  data: UpdateWeeklyMenuTemplateDto
) {
  const response = await apiClient.put<{ data: WeeklyMenuTemplate }>(
    `/weekly-menu-templates/${id}`,
    data
  );
  return response.data.data;
}

/**
 * Delete weekly menu template
 */
export async function deleteWeeklyMenuTemplate(id: string) {
  const response = await apiClient.delete(`/weekly-menu-templates/${id}`);
  return response.data;
}

/**
 * Get weekly menu templates for a specific site
 */
export async function getWeeklyMenuTemplatesForSite(
  siteId: string,
  year?: number,
  weekNumber?: number
) {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (weekNumber) params.append('weekNumber', weekNumber.toString());

  const response = await apiClient.get<{ data: { templates: WeeklyMenuTemplate[] } }>(
    `/weekly-menu-templates/site/${siteId}${params.toString() ? '?' + params.toString() : ''}`
  );
  return response.data.data;
}

/**
 * Upload weekly menu image
 */
export async function uploadWeeklyMenuImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<{
    data: { imageUrl: string; thumbnailUrl: string };
  }>('/weekly-menu-templates/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}
