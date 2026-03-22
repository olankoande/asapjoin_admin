import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import UndoIcon from '@mui/icons-material/Undo';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GavelIcon from '@mui/icons-material/Gavel';
import SendIcon from '@mui/icons-material/Send';
import ReportIcon from '@mui/icons-material/Report';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '../auth/AuthProvider';

const DRAWER_WIDTH = 240;

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
};

const menuItems: MenuItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Utilisateurs', path: '/users', icon: <PeopleIcon />, permission: 'users.read' },
  { label: 'Trajets', path: '/trips', icon: <DirectionsCarIcon />, permission: 'trips.read' },
  { label: 'Reservations', path: '/bookings', icon: <BookOnlineIcon />, permission: 'bookings.read' },
  { label: 'Livraisons', path: '/deliveries', icon: <LocalShippingIcon />, permission: 'deliveries.read' },
  { label: 'Paiements', path: '/payments', icon: <PaymentIcon />, permission: 'payments.read' },
  { label: 'Remboursements', path: '/refunds', icon: <UndoIcon />, permission: 'refunds.read' },
  { label: 'Wallet', path: '/wallet', icon: <AccountBalanceWalletIcon />, permission: 'wallet.read' },
  { label: 'Politiques', path: '/policies', icon: <GavelIcon />, permission: 'refunds.read' },
  { label: 'Payouts', path: '/payouts', icon: <SendIcon />, permission: 'payouts.read' },
  { label: 'Ledger & Commissions', path: '/ledger', icon: <ReceiptLongIcon />, permission: 'payments.read' },
  { label: 'Litiges', path: '/disputes', icon: <WarningAmberIcon />, permission: 'disputes.read' },
  { label: 'Annulations', path: '/cancellations', icon: <CancelIcon />, permission: 'refunds.read' },
  { label: 'Signalements', path: '/reports', icon: <ReportIcon />, permission: 'reports.read' },
  { label: 'Audit Logs', path: '/audit-logs', icon: <HistoryIcon />, permission: 'reports.read' },
  { label: 'Tarification', path: '/settings', icon: <TuneIcon />, permission: 'roles.update' },
  { label: 'Contrat', path: '/contracts', icon: <DescriptionIcon />, permission: 'roles.update' },
  { label: 'Roles', path: '/roles', icon: <AdminPanelSettingsIcon />, permission: 'roles.read' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuth();
  const visibleItems = menuItems.filter((item) => !item.permission || can(item.permission));

  return (
    <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" noWrap fontWeight="bold">AsapJoin</Typography>
          <Typography variant="caption" color="text.secondary">Admin</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {visibleItems.map((item) => (
          <ListItemButton key={item.path} selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
