import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { payoutsApi } from '../../api/endpoints';
import type { Payout, PayoutBatch, PayoutEligible } from '../../api/types';
import { getApiError } from '../../api/httpClient';
import { useAuth } from '../../auth/AuthProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatMoney } from '../../utils/format';

const statusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'sent':
    case 'processing':
      return 'info';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const [tab, setTab] = useState(0);
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [executeBatch, setExecuteBatch] = useState<PayoutBatch | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [providerReference, setProviderReference] = useState('');
  const [failureReason, setFailureReason] = useState('');

  const eligible = useQuery({
    queryKey: ['admin-eligible', scheduledFor],
    queryFn: () => payoutsApi.eligible(scheduledFor).then((response) => response.data),
    enabled: tab === 0,
  });

  const batches = useQuery({
    queryKey: ['admin-payout-batches', scheduledFor, statusFilter],
    queryFn: () => payoutsApi.batches({ scheduledFor, status: statusFilter || undefined }).then((response) => response.data),
    enabled: tab === 1,
  });

  const payouts = useQuery({
    queryKey: ['admin-payouts', scheduledFor, statusFilter],
    queryFn: () => payoutsApi.payouts({ scheduledFor, status: statusFilter || undefined }).then((response) => response.data),
    enabled: tab === 1,
  });

  const eligibleEntries = eligible.data ?? [];
  const eligibleCount = eligibleEntries.filter((entry) => entry.eligible).length;
  const eligibleAmount = eligibleEntries
    .filter((entry) => entry.eligible)
    .reduce((sum, entry) => sum + entry.available_dollars, 0);

  const createBatch = useMutation({
    mutationFn: (entries: PayoutEligible[]) =>
      payoutsApi.createBatch({
        scheduled_for: scheduledFor,
        user_ids: entries.filter((entry) => entry.eligible).map((entry) => entry.user_id),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-eligible'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-payout-batches'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-payouts'] }),
      ]);
      toast.success('Batch de paiement créé');
      setConfirmBatch(false);
      setTab(1);
    },
    onError: (error) => {
      toast.error(getApiError(error).message);
      setConfirmBatch(false);
    },
  });

  const executeBatchMutation = useMutation({
    mutationFn: (id: string) => payoutsApi.executeBatch(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-payout-batches'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-payouts'] }),
      ]);
      toast.success('Batch exécuté');
      setExecuteBatch(null);
    },
    onError: (error) => {
      toast.error(getApiError(error).message);
      setExecuteBatch(null);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ payoutId, reference }: { payoutId: string; reference?: string }) => payoutsApi.markPaid(payoutId, reference),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Paiement marqué comme effectué');
      setSelectedPayout(null);
      setProviderReference('');
    },
    onError: (error) => toast.error(getApiError(error).message),
  });

  const markFailedMutation = useMutation({
    mutationFn: ({ payoutId, reason }: { payoutId: string; reason?: string }) => payoutsApi.markFailed(payoutId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Paiement marqué en échec');
      setSelectedPayout(null);
      setFailureReason('');
    },
    onError: (error) => toast.error(getApiError(error).message),
  });

  const groupedBatches = useMemo(() => batches.data ?? [], [batches.data]);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Payouts conducteurs</Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          type="date"
          label="Date de paiement"
          value={scheduledFor}
          onChange={(event) => setScheduledFor(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          select
          size="small"
          label="Statut"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="queued">Queued</MenuItem>
          <MenuItem value="sent">Sent</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
        </TextField>
      </Stack>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Éligibles" />
        <Tab label="Paiements par date" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ flex: 1 }}>
              {eligibleCount} conducteur(s) éligible(s) pour {formatMoney(eligibleAmount)} à la date du {scheduledFor}.
            </Alert>
            <Button
              variant="contained"
              disabled={eligibleCount === 0 || !can('payouts.create')}
              onClick={() => setConfirmBatch(true)}
            >
              Créer le batch
            </Button>
          </Stack>

          {eligible.error && <Alert severity="error">{getApiError(eligible.error).message}</Alert>}
          {eligible.isLoading ? <CircularProgress /> : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Conducteur</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Moyen de paiement</TableCell>
                    <TableCell align="right">Montant</TableCell>
                    <TableCell>Éligible</TableCell>
                    <TableCell>Infos manquantes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eligibleEntries.map((entry) => (
                    <TableRow key={entry.user_id} hover>
                      <TableCell>{entry.first_name || '-'} {entry.last_name || ''}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.phone_number || '-'}</TableCell>
                      <TableCell>{entry.payout_email || entry.payout_phone || '-'}</TableCell>
                      <TableCell align="right">{formatMoney(entry.available_dollars)}</TableCell>
                      <TableCell>
                        <Chip label={entry.eligible ? 'Oui' : 'Non'} color={entry.eligible ? 'success' : 'error'} size="small" />
                      </TableCell>
                      <TableCell>{entry.missing_info.length > 0 ? entry.missing_info.join(', ') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Stack spacing={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Batches du {scheduledFor}</Typography>
            {batches.error && <Alert severity="error">{getApiError(batches.error).message}</Alert>}
            {batches.isLoading ? <CircularProgress /> : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Batch</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Nb payouts</TableCell>
                      <TableCell align="right">Montant total</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedBatches.map((batch) => {
                      const total = (batch.payouts ?? []).reduce((sum, payout) => sum + Number(payout.amount), 0);
                      return (
                        <TableRow key={batch.id}>
                          <TableCell>{batch.id}</TableCell>
                          <TableCell>{new Date(batch.scheduled_for_date).toLocaleDateString()}</TableCell>
                          <TableCell><Chip label={batch.status} size="small" color={statusColor(batch.status) as never} /></TableCell>
                          <TableCell align="right">{batch.payouts?.length ?? 0}</TableCell>
                          <TableCell align="right">{formatMoney(total)}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={batch.status !== 'draft' || !can('payouts.execute')}
                              onClick={() => setExecuteBatch(batch)}
                            >
                              Exécuter
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Conducteurs à payer / suivis</Typography>
            {payouts.error && <Alert severity="error">{getApiError(payouts.error).message}</Alert>}
            {payouts.isLoading ? <CircularProgress /> : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Conducteur</TableCell>
                      <TableCell>Contact payout</TableCell>
                      <TableCell>Batch</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Montant</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(payouts.data ?? []).map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{payout.users?.first_name || '-'} {payout.users?.last_name || ''}</TableCell>
                        <TableCell>{payout.users?.payout_email || payout.destination || payout.users?.email || '-'}</TableCell>
                        <TableCell>{payout.batch?.id || payout.batch_id}</TableCell>
                        <TableCell>
                          <Chip label={payout.status} size="small" color={statusColor(payout.status) as never} />
                        </TableCell>
                        <TableCell align="right">{formatMoney(Number(payout.amount))}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={!['queued', 'sent'].includes(payout.status) || !can('payouts.execute')}
                              onClick={() => {
                                setSelectedPayout(payout);
                                setFailureReason('');
                              }}
                            >
                              Marquer payé
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              disabled={!['queued', 'sent'].includes(payout.status) || !can('payouts.execute')}
                              onClick={() => {
                                setSelectedPayout({ ...payout, status: 'failed' });
                                setProviderReference('');
                              }}
                            >
                              Marquer échec
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Stack>
      )}

      <ConfirmDialog
        open={confirmBatch}
        title="Créer le batch de paiement"
        message={`Créer le batch de paiements du ${scheduledFor} pour ${eligibleCount} conducteur(s) ?`}
        onConfirm={() => createBatch.mutate(eligibleEntries)}
        onCancel={() => setConfirmBatch(false)}
        loading={createBatch.isPending}
      />

      <ConfirmDialog
        open={!!executeBatch}
        title="Exécuter le batch"
        message={`Débiter les wallets et passer le batch ${executeBatch?.id} en envoi ?`}
        onConfirm={() => executeBatch && executeBatchMutation.mutate(executeBatch.id)}
        onCancel={() => setExecuteBatch(null)}
        loading={executeBatchMutation.isPending}
      />

      <Dialog open={!!selectedPayout && selectedPayout.status !== 'failed'} onClose={() => setSelectedPayout(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer le paiement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Référence de paiement"
            value={providerReference}
            onChange={(event) => setProviderReference(event.target.value)}
            helperText="Optionnel: numéro de virement, référence bancaire, etc."
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPayout(null)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={() => selectedPayout && markPaidMutation.mutate({ payoutId: selectedPayout.id, reference: providerReference || undefined })}
            disabled={markPaidMutation.isPending}
          >
            Marquer payé
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedPayout && selectedPayout.status === 'failed'} onClose={() => setSelectedPayout(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Marquer le paiement en échec</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Raison"
            value={failureReason}
            onChange={(event) => setFailureReason(event.target.value)}
            helperText="Optionnel: motif de retour ou d'échec du paiement"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPayout(null)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => selectedPayout && markFailedMutation.mutate({ payoutId: selectedPayout.id, reason: failureReason || undefined })}
            disabled={markFailedMutation.isPending}
          >
            Marquer échec
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
