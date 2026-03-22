import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Outlet } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import { useAuth } from '../auth/AuthProvider';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>AsapJoin Admin</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{user?.email}</Typography>
          <IconButton color="inherit" onClick={logout}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${DRAWER_WIDTH}px`, mt: '64px' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
