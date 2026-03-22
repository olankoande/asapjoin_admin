import http from '../../../api/httpClient';
import type { Permission, Role } from '../../../api/types';

export const rolesApi = {
  list: (search?: string) => http.get<Role[]>('/admin/roles', { params: search ? { search } : {} }),
  get: (id: string) => http.get<Role>(`/admin/roles/${id}`),
  create: (body: { name: string; code: string; description?: string }) => http.post<Role>('/admin/roles', body),
  update: (id: string, body: { name?: string; description?: string }) => http.patch<Role>(`/admin/roles/${id}`, body),
  remove: (id: string) => http.delete(`/admin/roles/${id}`),
  getPermissions: (id: string) => http.get<Permission[]>(`/admin/roles/${id}/permissions`),
  replacePermissions: (id: string, permissionIds: string[]) => http.put<Permission[]>(`/admin/roles/${id}/permissions`, { permissionIds }),
};
