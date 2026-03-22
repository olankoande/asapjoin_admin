import { createBrowserRouter } from 'react-router-dom';
import RequireAuth from '../auth/RequireAuth';
import AdminLayout from '../layout/AdminLayout';
import LoginPage from '../auth/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import UsersPage from '../pages/Users/UsersPage';
import TripsPage from '../pages/Trips/TripsPage';
import BookingsPage from '../pages/Bookings/BookingsPage';
import DeliveriesPage from '../pages/Deliveries/DeliveriesPage';
import PaymentsPage from '../pages/Payments/PaymentsPage';
import RefundsPage from '../pages/Refunds/RefundsPage';
import WalletPage from '../pages/Wallet/WalletPage';
import PoliciesPage from '../pages/Policies/PoliciesPage';
import PayoutsPage from '../pages/Payouts/PayoutsPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import AuditLogsPage from '../pages/AuditLogs/AuditLogsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import LedgerPage from '../pages/Ledger/LedgerPage';
import DisputesPage from '../pages/Disputes/DisputesPage';
import CancellationsPage from '../pages/Cancellations/CancellationsPage';
import ContractsPage from '../pages/Contracts/ContractsPage';
import RequirePermission from '../features/rbac/components/RequirePermission';
import RolesListPage from '../features/rbac/pages/RolesListPage';
import RoleCreatePage from '../features/rbac/pages/RoleCreatePage';
import RoleEditPage from '../features/rbac/pages/RoleEditPage';
import UserRolesPage from '../features/rbac/pages/UserRolesPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/users', element: <RequirePermission permission="users.read"><UsersPage /></RequirePermission> },
          { path: '/users/:id/roles', element: <RequirePermission permission="users.update"><UserRolesPage /></RequirePermission> },
          { path: '/trips', element: <RequirePermission permission="trips.read"><TripsPage /></RequirePermission> },
          { path: '/bookings', element: <RequirePermission permission="bookings.read"><BookingsPage /></RequirePermission> },
          { path: '/deliveries', element: <RequirePermission permission="deliveries.read"><DeliveriesPage /></RequirePermission> },
          { path: '/payments', element: <RequirePermission permission="payments.read"><PaymentsPage /></RequirePermission> },
          { path: '/refunds', element: <RequirePermission permission="refunds.read"><RefundsPage /></RequirePermission> },
          { path: '/wallet', element: <RequirePermission permission="wallet.read"><WalletPage /></RequirePermission> },
          { path: '/policies', element: <RequirePermission permission="refunds.read"><PoliciesPage /></RequirePermission> },
          { path: '/payouts', element: <RequirePermission permission="payouts.read"><PayoutsPage /></RequirePermission> },
          { path: '/reports', element: <RequirePermission permission="reports.read"><ReportsPage /></RequirePermission> },
          { path: '/audit-logs', element: <RequirePermission permission="reports.read"><AuditLogsPage /></RequirePermission> },
          { path: '/ledger', element: <RequirePermission permission="payments.read"><LedgerPage /></RequirePermission> },
          { path: '/disputes', element: <RequirePermission permission="disputes.read"><DisputesPage /></RequirePermission> },
          { path: '/cancellations', element: <RequirePermission permission="refunds.read"><CancellationsPage /></RequirePermission> },
          { path: '/settings', element: <RequirePermission permission="roles.update"><SettingsPage /></RequirePermission> },
          { path: '/contracts', element: <RequirePermission permission="roles.update"><ContractsPage /></RequirePermission> },
          { path: '/roles', element: <RequirePermission permission="roles.read"><RolesListPage /></RequirePermission> },
          { path: '/roles/new', element: <RequirePermission permission="roles.create"><RoleCreatePage /></RequirePermission> },
          { path: '/roles/:id', element: <RequirePermission permission="roles.update"><RoleEditPage /></RequirePermission> },
        ],
      },
    ],
  },
]);
