import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import { refundsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import { useAuth } from '../../auth/AuthProvider';
import StatusChip from '../../components/StatusChip';
import { formatDate, formatMoney } from '../../utils/format';

export default function RefundsPage() {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ payment_id: '', amount: '', reason: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: () => refundsApi.list().then((response) => response.data),
  });

  const create = useMutation({
    mutationFn: () => refundsApi.create({ payment_id: form.payment_id, amount: parseFloat(form.amount), reason: form.reason || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast.success('Remboursement cree');
      setOpen(false);
      setForm({ payment_id: '', amount: '', reason: '' });
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Remboursements</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disabled={!can('refunds.create')}>
          Nouveau remboursement
        </Button>
      </Box>

      {error && <Alert severity="error">{getApiError(error).message}</Alert>}

      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Payment ID</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Raison</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Cree le</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>{String(refund.id).slice(0, 8)}</TableCell>
                  <TableCell>{String(refund.payment_id).slice(0, 8)}</TableCell>
                  <TableCell>{formatMoney(Number(refund.amount) || 0)}</TableCell>
                  <TableCell>{refund.reason || '-'}</TableCell>
                  <TableCell><StatusChip status={refund.status} /></TableCell>
                  <TableCell>{formatDate(refund.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Creer un remboursement</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Payment ID" value={form.payment_id} onChange={(event) => setForm((current) => ({ ...current, payment_id: event.target.value }))} required />
          <TextField label="Montant" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
          <TextField label="Raison" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={() => create.mutate()} disabled={create.isPending || !form.payment_id || !form.amount || !can('refunds.create')}>
            {create.isPending ? 'En cours...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
