import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../api/rolesApi';

export function useRole(roleId: string) {
  return useQuery({
    queryKey: ['rbac-role', roleId],
    queryFn: () => rolesApi.get(roleId).then((response) => response.data),
    enabled: Boolean(roleId),
  });
}
