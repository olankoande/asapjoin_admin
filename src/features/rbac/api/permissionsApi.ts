import http from '../../../api/httpClient';
import type { Permission } from '../../../api/types';

export const permissionsApi = {
  list: () => http.get<Permission[]>('/admin/permissions'),
  current: () => http.get<{ permissions: string[] }>('/me/permissions'),
};
