import { useAuth } from '../../../auth/AuthProvider';

export function useCurrentPermissions() {
  const { permissions, can, canAny } = useAuth();
  return { permissions, can, canAny };
}
