import http from '../../../api/httpClient';
import type { UserRolesPayload } from '../../../api/types';

export const userRolesApi = {
  get: (userId: string) => http.get<UserRolesPayload>(`/admin/users/${userId}/roles`),
  replace: (userId: string, roleIds: string[]) => http.put<UserRolesPayload>(`/admin/users/${userId}/roles`, { roleIds }),
  current: () => http.get<{ roles: string[] }>('/me/roles'),
};
