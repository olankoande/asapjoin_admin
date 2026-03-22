import { useQuery } from '@tanstack/react-query';
import { userRolesApi } from '../api/userRolesApi';

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ['rbac-user-roles', userId],
    queryFn: () => userRolesApi.get(userId).then((response) => response.data),
    enabled: Boolean(userId),
  });
}
