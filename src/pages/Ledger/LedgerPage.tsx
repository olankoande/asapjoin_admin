import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Paper, CircularProgress, Alert, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, TablePagination, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Tooltip,
} from '@mui/material';
import {
  TrendingUp, AccountBalance, MoneyOff, SwapHoriz, PieChart,
} from '@mui/icons-material';
import { ledgerApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import { formatMoney, formatDate } from '../../utils/format';

/* ─── Summary Card ─── */
interface SummaryCardProps {
  title: string;
  amount: number;
  count: number;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ title, amount, count, icon, color }: SummaryCardProps) {
  return (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderLeft: `4px solid ${color}` }}>
      <Box sx={{ bgcolor: `${color}20`, borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">{formatMoney(amount)}</Typography>
        <Typography variant="caption" color="text.secondary">{count} transaction{count !== 1 ? 's' : ''}</Typography>
      </Box>
    </Paper>
  );
}

/* ─── Txn Type Labels ─── */
const txnTypeLabels: Record<string, string> = {
  booking_payment: 'Paiement réservation',
  delivery_payment: 'Paiement livraison',
  platform_commission: 'Commission plateforme',
  driver_credit_pending: 'Crédit chauffeur (en attente)',
  driver_release_to_available: 'Libération → disponible',
  refund: 'Remboursement',
  refund_commission_reversal: 'Annulation commission',
  refund_driver_debit: 'Débit chauffeur (remb.)',
  dispute_hold: 'Blocage litige',
  dispute_release: 'Libération litige',
  payout: 'Virement',
  payout_reversal: 'Annulation virement',
  adjustment: 'Ajustement',
};

const txnTypeColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  booking_payment: 'success',
  delivery_payment: 'success',
  platform_commission: 'info',
  driver_credit_pending: 'warning',
  driver_release_to_available: 'success',
  refund: 'error',
  refund_commission_reversal: 'warning',
  refund_driver_debit: 'error',
  dispute_hold: 'error',
  dispute_release: 'success',
  payout: 'default',
  payout_reversal: 'warning',
  adjustment: 'default',
};

const directionColors: Record<string, 'success' | 'error'> = {
  credit: 'success',
  debit: 'error',
};

/* ─── Main Page ─── */
export default function LedgerPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filterTxnType, setFilterTxnType] = useState('');
  const [filterDirection, setFilterDirection] = useState('');

  // Summary query
  const { data: summary, isLoading: loadingSummary, error: errSummary } = useQuery({
    queryKey: ['admin-ledger-summary'],
    queryFn: () => ledgerApi.summary().then(r => r.data),
  });

  // Ledger entries query
  const params: Record<string, string> = {
    page: String(page + 1),
    limit: String(rowsPerPage),
  };
  if (filterTxnType) params.txn_type = filterTxnType;
  if (filterDirection) params.direction = filterDirection;

  const { data: ledgerData, isLoading: loadingLedger, error: errLedger } = useQuery({
    queryKey: ['admin-ledger', page, rowsPerPage, filterTxnType, filterDirection],
    queryFn: () => ledgerApi.list(params).then(r => r.data),
  });

  const entries = ledgerData?.data ?? [];
  const pagination = ledgerData?.pagination;

  const errors = [errSummary, errLedger].filter(Boolean);

  return (
    <Box>
      <Typography variant="h4" mb={1}>Ledger & Commissions</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Vue d'ensemble de la situation financière de la plateforme — commissions, paiements, remboursements et virements.
      </Typography>

      {errors.length > 0 && errors.map((e, i) => (
        <Alert key={i} severity="error" sx={{ mb: 2 }}>{getApiError(e!).message}</Alert>
      ))}

      {/* ─── Summary Cards ─── */}
      {loadingSummary ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : summary ? (
        <>
          <Grid container spacing={3} mb={4}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                title="Paiements bruts"
                amount={summary.gross_payments?.total_dollars ?? 0}
                count={summary.gross_payments?.count ?? 0}
                icon={<TrendingUp sx={{ color: '#2e7d32', fontSize: 28 }} />}
                color="#2e7d32"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                title="Commissions plateforme"
                amount={summary.commissions?.total_dollars ?? 0}
                count={summary.commissions?.count ?? 0}
                icon={<AccountBalance sx={{ color: '#1565c0', fontSize: 28 }} />}
                color="#1565c0"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                title="Net chauffeurs"
                amount={summary.driver_net?.total_dollars ?? 0}
                count={summary.driver_net?.count ?? 0}
                icon={<SwapHoriz sx={{ color: '#ed6c02', fontSize: 28 }} />}
                color="#ed6c02"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                title="Remboursements"
                amount={summary.refunds?.total_dollars ?? 0}
                count={summary.refunds?.count ?? 0}
                icon={<MoneyOff sx={{ color: '#d32f2f', fontSize: 28 }} />}
                color="#d32f2f"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                title="Virements (payouts)"
                amount={summary.payouts?.total_dollars ?? 0}
                count={summary.payouts?.count ?? 0}
                icon={<SwapHoriz sx={{ color: '#7b1fa2', fontSize: 28 }} />}
                color="#7b1fa2"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard
                title="Revenu net plateforme"
                amount={(summary.commissions?.total_dollars ?? 0) - (summary.refunds?.total_dollars ?? 0) * ((summary.commissions?.total_dollars ?? 0) / Math.max(summary.gross_payments?.total_dollars ?? 1, 1))}
                count={summary.commissions?.count ?? 0}
                icon={<PieChart sx={{ color: '#00897b', fontSize: 28 }} />}
                color="#00897b"
              />
            </Grid>
          </Grid>

          {/* ─── Commission Breakdown ─── */}
          {summary.commission_by_type && summary.commission_by_type.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Répartition des commissions</Typography>
                <Grid container spacing={3}>
                  {summary.commission_by_type.map((item: any) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.reference_type}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                          {item.reference_type === 'booking' ? '🚗 Réservations' : '📦 Livraisons'}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">{formatMoney(item.total_dollars)}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.count} commission{item.count !== 1 ? 's' : ''}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* ─── Recent Daily Commissions ─── */}
          {summary.recent_daily && summary.recent_daily.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Commissions quotidiennes (30 derniers jours)</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.recent_daily.map((day: any) => (
                        <TableRow key={day.day}>
                          <TableCell>{day.day}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{formatMoney(day.total_dollars)}</TableCell>
                          <TableCell align="right">{day.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <Divider sx={{ my: 3 }} />

      {/* ─── Ledger Entries Table ─── */}
      <Typography variant="h5" mb={2}>Écritures du ledger</Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Type de transaction</InputLabel>
          <Select
            value={filterTxnType}
            label="Type de transaction"
            onChange={(e) => { setFilterTxnType(e.target.value); setPage(0); }}
          >
            <MenuItem value="">Tous</MenuItem>
            {Object.entries(txnTypeLabels).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Direction</InputLabel>
          <Select
            value={filterDirection}
            label="Direction"
            onChange={(e) => { setFilterDirection(e.target.value); setPage(0); }}
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value="credit">Crédit</MenuItem>
            <MenuItem value="debit">Débit</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loadingLedger ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell>Réf. type</TableCell>
                  <TableCell>Réf. ID</TableCell>
                  <TableCell>Bucket</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>Aucune écriture trouvée</Typography>
                    </TableCell>
                  </TableRow>
                ) : entries.map((entry: any) => {
                  const user = entry.wallet?.user;
                  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '—';
                  const userEmail = user?.email || '';
                  const amountDollars = (entry.amount_cents ?? 0) / 100;

                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {String(entry.id).slice(0, 8)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(entry.created_at)}</TableCell>
                      <TableCell>
                        <Tooltip title={userEmail} arrow>
                          <span>{userName || String(entry.user_id || '').slice(0, 8)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={txnTypeLabels[entry.txn_type] || entry.txn_type || entry.type || '—'}
                          size="small"
                          color={txnTypeColors[entry.txn_type] || 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {entry.direction ? (
                          <Chip
                            label={entry.direction === 'credit' ? '↑ Crédit' : '↓ Débit'}
                            size="small"
                            color={directionColors[entry.direction] || 'default'}
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: entry.direction === 'credit' ? '#2e7d32' : '#d32f2f' }}>
                        {entry.direction === 'debit' ? '−' : '+'}{formatMoney(amountDollars)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" textTransform="capitalize">
                          {entry.reference_type || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {entry.reference_id ? String(entry.reference_id).slice(0, 8) : '—'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{entry.balance_bucket || '—'}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination && (
            <TablePagination
              component="div"
              count={pagination.total ?? 0}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Lignes par page"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
            />
          )}
        </>
      )}
    </Box>
  );
}
