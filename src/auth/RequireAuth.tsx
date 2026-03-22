import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function RequireAuth() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'support') return <Navigate to="/login" replace />;
  return <Outlet />;
}
