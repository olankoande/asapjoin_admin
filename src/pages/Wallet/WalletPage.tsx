import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material';
import { walletApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import { formatDate, formatMoney } from '../../utils/format';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const [userId, setUserId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ amount: '', type: 'CREDIT', reason: '' });

  const wallet = useQuery({ queryKey: ['admin-wallet', searchId], queryFn: () => walletApi.getByUser(searchId).then(r => r.data), enabled: !!searchId });
  const txns = useQuery({ queryKey: ['admin-wallet-txns', searchId], queryFn: () => walletApi.getTransactions(searchId).then(r => r.data), enabled: !!searchId });

  const adjust = useMutation({
    mutationFn: () => walletApi.adjust({ user_id: searchId, amount: parseFloat(adjustForm.amount), type: adjustForm.type, reason: adjustForm.reason }),
    onSuccess: () => { toast.success('Ajustement effectué'); setAdjustOpen(false); wallet.refetch(); txns.refetch(); },
    onError: (e) => toast.error(getApiError(e).message),
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>Wallet</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField size="small" label="User ID" value={userId} onChange={e => setUserId(e.target.value)} sx={{ minWidth: 300 }} />
        <Button variant="contained" onClick={() => setSearchId(userId)}>Rechercher</Button>
      </Box>
      {wallet.error && <Alert severity="error">{getApiError(wallet.error).message}</Alert>}
      {wallet.isLoading && <CircularProgress />}
      {wallet.data && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">Wallet de {wallet.data.user?.email || searchId}</Typography>
            <Typography>Solde disponible: <strong>{formatMoney(wallet.data.available_balance)}</strong></Typography>
            <Typography>Solde en attente: <strong>{formatMoney(wallet.data.pending_balance)}</strong></Typography>
            <Typography>Devise: {wallet.data.currency}</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setAdjustOpen(true)}>Ajustement</Button>
          </CardContent>
        </Card>
      )}
      {txns.data && (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow>
            <TableCell>Type</TableCell><TableCell>Montant</TableCell><TableCell>Solde après</TableCell>
            <TableCell>Référence</TableCell><TableCell>Description</TableCell><TableCell>Date</TableCell>
          </TableRow></TableHead>
          <TableBody>{txns.data.map(t => (
            <TableRow key={t.id}>
              <TableCell>{t.type}</TableCell>
              <TableCell sx={{ color: t.amount >= 0 ? 'green' : 'red' }}>{formatMoney(t.amount)}</TableCell>
              <TableCell>{formatMoney(t.balance_after)}</TableCell>
              <TableCell>{t.reference_type ? `${t.reference_type}:${String(t.reference_id || '').slice(0,8)}` : '—'}</TableCell>
              <TableCell>{t.description || '—'}</TableCell>
              <TableCell>{formatDate(t.created_at)}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajustement Wallet</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField select label="Type" value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}>
            <MenuItem value="CREDIT">Crédit</MenuItem>
            <MenuItem value="DEBIT">Débit</MenuItem>
          </TextField>
          <TextField label="Montant" type="number" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} required />
          <TextField label="Raison (obligatoire)" value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} multiline rows={2} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Annuler</Button>
          <Button variant="contained" color="warning" onClick={() => adjust.mutate()} disabled={adjust.isPending || !adjustForm.amount || !adjustForm.reason}>
            {adjust.isPending ? 'En cours…' : 'Confirmer ajustement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
