import { useQuery } from '@tanstack/react-query';
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { AccountBalance, BookOnline, DirectionsCar, LocalShipping, Payment, People, SwapHoriz, TrendingUp } from '@mui/icons-material';
import { bookingsApi, deliveriesApi, ledgerApi, paymentsApi, tripsApi, usersApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import { useAuth } from '../../auth/AuthProvider';
import { formatMoney } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderLeft: `4px solid ${color}` }}>
      <Box sx={{ bgcolor: `${color}20`, borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const { can, canAny } = useAuth();

  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: () => usersApi.list().then((response) => response.data),
    enabled: can('users.read'),
  });

  const { data: trips, isLoading: loadingTrips, error: tripsError } = useQuery({
    queryKey: ['admin-trips-stats'],
    queryFn: () => tripsApi.list().then((response) => response.data),
    enabled: can('trips.read'),
  });

  const { data: bookings, isLoading: loadingBookings, error: bookingsError } = useQuery({
    queryKey: ['admin-bookings-stats'],
    queryFn: () => bookingsApi.list().then((response) => response.data),
    enabled: can('bookings.read'),
  });

  const { data: deliveries, isLoading: loadingDeliveries, error: deliveriesError } = useQuery({
    queryKey: ['admin-deliveries-stats'],
    queryFn: () => deliveriesApi.list().then((response) => response.data),
    enabled: can('deliveries.read'),
  });

  const { data: payments, isLoading: loadingPayments, error: paymentsError } = useQuery({
    queryKey: ['admin-payments-stats'],
    queryFn: () => paymentsApi.list().then((response) => response.data),
    enabled: can('payments.read'),
  });

  const { data: ledgerSummary, isLoading: loadingLedger } = useQuery({
    queryKey: ['admin-ledger-summary-dashboard'],
    queryFn: () => ledgerApi.summary().then((response) => response.data),
    enabled: can('payments.read'),
  });

  const errors = [usersError, tripsError, bookingsError, deliveriesError, paymentsError].filter(Boolean);
  const isLoading = loadingUsers || loadingTrips || loadingBookings || loadingDeliveries || loadingPayments;

  const cards = [
    can('users.read') ? {
      title: 'Utilisateurs',
      value: users?.length ?? 0,
      icon: <People sx={{ color: '#1976d2', fontSize: 28 }} />,
      color: '#1976d2',
      subtitle: `${users?.filter((user) => user.is_banned).length ?? 0} banni(s)`,
    } : null,
    can('trips.read') ? {
      title: 'Trajets',
      value: trips?.length ?? 0,
      icon: <DirectionsCar sx={{ color: '#2e7d32', fontSize: 28 }} />,
      color: '#2e7d32',
      subtitle: `${trips?.filter((trip) => trip.status === 'published').length ?? 0} publies`,
    } : null,
    can('bookings.read') ? {
      title: 'Reservations',
      value: bookings?.length ?? 0,
      icon: <BookOnline sx={{ color: '#ed6c02', fontSize: 28 }} />,
      color: '#ed6c02',
      subtitle: `${bookings?.filter((booking) => booking.status === 'accepted' || booking.status === 'completed').length ?? 0} acceptees/terminees`,
    } : null,
    can('deliveries.read') ? {
      title: 'Livraisons',
      value: deliveries?.length ?? 0,
      icon: <LocalShipping sx={{ color: '#9c27b0', fontSize: 28 }} />,
      color: '#9c27b0',
    } : null,
    can('payments.read') ? {
      title: 'Paiements',
      value: payments?.length ?? 0,
      icon: <Payment sx={{ color: '#0288d1', fontSize: 28 }} />,
      color: '#0288d1',
    } : null,
    can('payments.read') ? {
      title: 'Revenus totaux',
      value: formatMoney(payments?.filter((payment) => payment.status === 'succeeded').reduce((sum, payment) => sum + Number(payment.amount), 0) ?? 0),
      icon: <TrendingUp sx={{ color: '#388e3c', fontSize: 28 }} />,
      color: '#388e3c',
      subtitle: 'Paiements reussis',
    } : null,
  ].filter(Boolean) as StatCardProps[];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Tableau de bord</Typography>

      {!canAny('users.read', 'trips.read', 'bookings.read', 'deliveries.read', 'payments.read') && (
        <Alert severity="info" sx={{ mb: 2 }}>Aucune statistique n'est disponible avec vos permissions actuelles.</Alert>
      )}

      {errors.map((error, index) => (
        <Alert key={index} severity="error" sx={{ mb: 1 }}>{getApiError(error).message}</Alert>
      ))}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loadingLedger && ledgerSummary && can('payments.read') && (
        <Box mt={4}>
          <Typography variant="h5" mb={2}>Commissions & Ledger</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Paiements bruts"
                value={formatMoney(ledgerSummary.gross_payments?.total_dollars ?? 0)}
                icon={<TrendingUp sx={{ color: '#2e7d32', fontSize: 28 }} />}
                color="#2e7d32"
                subtitle={`${ledgerSummary.gross_payments?.count ?? 0} transaction(s)`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Commissions plateforme"
                value={formatMoney(ledgerSummary.commissions?.total_dollars ?? 0)}
                icon={<AccountBalance sx={{ color: '#1565c0', fontSize: 28 }} />}
                color="#1565c0"
                subtitle={`${ledgerSummary.commissions?.count ?? 0} commission(s)`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Net chauffeurs"
                value={formatMoney(ledgerSummary.driver_net?.total_dollars ?? 0)}
                icon={<SwapHoriz sx={{ color: '#ed6c02', fontSize: 28 }} />}
                color="#ed6c02"
                subtitle={`${ledgerSummary.driver_net?.count ?? 0} credit(s)`}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
