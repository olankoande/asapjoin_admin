import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '../api/permissionsApi';

export function usePermissions() {
  return useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: () => permissionsApi.list().then((response) => response.data),
  });
}
