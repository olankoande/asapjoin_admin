import { Alert, Box } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';

interface RequirePermissionProps {
  permission: string;
  redirectTo?: string;
  children?: React.ReactNode;
}

export default function RequirePermission({ permission, redirectTo, children }: RequirePermissionProps) {
  const { isReady, can } = useAuth();

  if (!isReady) return null;
  if (can(permission)) return children ? <>{children}</> : <Outlet />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">Acces refuse: permission `{permission}` requise.</Alert>
    </Box>
  );
}
