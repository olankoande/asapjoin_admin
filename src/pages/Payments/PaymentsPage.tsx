import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert } from '@mui/material';
import { paymentsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import StatusChip from '../../components/StatusChip';
import { formatDate, formatMoney } from '../../utils/format';

export default function PaymentsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-payments'], queryFn: () => paymentsApi.list().then(r => r.data) });
  return (
    <Box>
      <Typography variant="h4" mb={3}>Paiements</Typography>
      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow>
            <TableCell>ID</TableCell><TableCell>Payeur</TableCell><TableCell>Montant</TableCell>
            <TableCell>Devise</TableCell><TableCell>Statut</TableCell><TableCell>Stripe PI</TableCell><TableCell>Créé le</TableCell>
          </TableRow></TableHead>
          <TableBody>{data?.map(p => (
            <TableRow key={p.id}>
              <TableCell>{String(p.id).slice(0,8)}</TableCell>
              <TableCell>{p.payer?.email || String(p.payer_id).slice(0,8)}</TableCell>
              <TableCell>{formatMoney(Number(p.amount) || 0)}</TableCell>
              <TableCell>{p.currency}</TableCell>
              <TableCell><StatusChip status={p.status} /></TableCell>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{((p as any).stripe_payment_intent_id || p.stripe_payment_intent || '—').slice(0,20)}{((p as any).stripe_payment_intent_id || p.stripe_payment_intent) ? '…' : ''}</TableCell>
              <TableCell>{formatDate(p.created_at)}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
    </Box>
  );
}
