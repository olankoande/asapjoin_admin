import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../api/rolesApi';

export function useRoles(search?: string) {
  return useQuery({
    queryKey: ['rbac-roles', search],
    queryFn: () => rolesApi.list(search).then((response) => response.data),
  });
}
