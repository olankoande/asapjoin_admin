import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, CircularProgress, Alert, Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GavelIcon from '@mui/icons-material/Gavel';
import SendIcon from '@mui/icons-material/Send';
import { adminDisputesApi, type AdminDisputeDetail, type DisputeReply } from '../../features/disputes/api/adminDisputesApi';
import { DISPUTE_STATUS_LABELS, DISPUTE_STATUS_COLORS, type AdminDispute, type ResolveOutcome } from '../../features/disputes/types/adminDispute.types';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<ResolveOutcome>('refund_customer');
  const [resolveNote, setResolveNote] = useState('');
  const [resolveRefundCents, setResolveRefundCents] = useState(0);
  const [resolveReleaseCents, setResolveReleaseCents] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await adminDisputesApi.list(params);
      setDisputes(res.data.disputes || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, [statusFilter]);

  const openDetail = async (id: string) => {
    try {
      const res = await adminDisputesApi.get(id);
      setSelectedDispute(res.data);
      setDetailOpen(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur');
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setResolving(true);
    try {
      await adminDisputesApi.resolve(selectedDispute.id, {
        outcome: resolveOutcome,
        refund_amount_cents: resolveOutcome === 'split' ? resolveRefundCents : undefined,
        release_amount_cents: resolveOutcome === 'split' ? resolveReleaseCents : undefined,
        note: resolveNote || undefined,
      });
      setResolveOpen(false);
      setDetailOpen(false);
      fetchDisputes();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la résolution');
    } finally {
      setResolving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDispute) return;
    try {
      await adminDisputesApi.updateStatus(selectedDispute.id, newStatus);
      const res = await adminDisputesApi.get(selectedDispute.id);
      setSelectedDispute(res.data);
      fetchDisputes();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur');
    }
  };

  const handleReply = async () => {
    if (!selectedDispute || !replyMessage.trim()) return;
    setReplying(true);
    try {
      await adminDisputesApi.reply(selectedDispute.id, replyMessage.trim());
      setReplyMessage('');
      const res = await adminDisputesApi.get(selectedDispute.id);
      setSelectedDispute(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur');
    } finally {
      setReplying(false);
    }
  };

  const statusColor = (status: string) => DISPUTE_STATUS_COLORS[status] || 'default';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Litiges</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchDisputes} variant="outlined" size="small">Actualiser</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Statut</InputLabel>
          <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="open">Ouvert</MenuItem>
            <MenuItem value="investigating">En investigation</MenuItem>
            <MenuItem value="resolved_refund">Résolu — Remboursé</MenuItem>
            <MenuItem value="resolved_release">Résolu — Libéré</MenuItem>
            <MenuItem value="resolved_split">Résolu — Partage</MenuItem>
            <MenuItem value="closed">Fermé</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Réf.</TableCell>
              <TableCell>Motif</TableCell>
              <TableCell>Montant gelé</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : disputes.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">Aucun litige</TableCell></TableRow>
            ) : disputes.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{String(d.id).slice(0, 8)}</TableCell>
                <TableCell><Chip label={d.kind === 'booking' ? 'Réservation' : 'Livraison'} size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{String(d.reference_id).slice(0, 8)}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason}</TableCell>
                <TableCell>{formatCurrency(d.hold_amount_cents)}</TableCell>
                <TableCell><Chip label={DISPUTE_STATUS_LABELS[d.status] || d.status} size="small" color={statusColor(d.status)} /></TableCell>
                <TableCell sx={{ fontSize: 12 }}>{formatDate(d.created_at)}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openDetail(d.id)} title="Détails"><VisibilityIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedDispute && (
          <>
            <DialogTitle>
              Litige #{String(selectedDispute.id).slice(0, 8)} — {selectedDispute.kind === 'booking' ? 'Réservation' : 'Livraison'}
            </DialogTitle>
            <DialogContent dividers>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Statut</Typography>
                  <Box><Chip label={DISPUTE_STATUS_LABELS[selectedDispute.status] || selectedDispute.status} color={statusColor(selectedDispute.status)} size="small" /></Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Montant gelé</Typography>
                  <Typography fontWeight="bold">{formatCurrency(selectedDispute.hold_amount_cents)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ouvert par</Typography>
                  <Typography>{selectedDispute.opener ? `${selectedDispute.opener.first_name} ${selectedDispute.opener.last_name} (${selectedDispute.opener.email})` : `User #${String(selectedDispute.opened_by).slice(0, 8)}`}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date d'ouverture</Typography>
                  <Typography>{formatDate(selectedDispute.created_at)}</Typography>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary">Motif</Typography>
              <Typography mb={2}>{selectedDispute.reason}</Typography>

              {selectedDispute.resolution_note && (
                <Alert severity="info" sx={{ mb: 2 }}>Note de résolution : {selectedDispute.resolution_note}</Alert>
              )}

              {/* Status actions */}
              {['open', 'investigating'].includes(selectedDispute.status) && (
                <Box display="flex" gap={1} mb={2}>
                  {selectedDispute.status === 'open' && (
                    <Button size="small" variant="outlined" color="info" onClick={() => handleStatusChange('investigating')}>
                      Passer en investigation
                    </Button>
                  )}
                  <Button size="small" variant="contained" color="warning" startIcon={<GavelIcon />} onClick={() => {
                    setResolveOutcome('refund_customer');
                    setResolveNote('');
                    setResolveRefundCents(selectedDispute.hold_amount_cents);
                    setResolveReleaseCents(0);
                    setResolveOpen(true);
                  }}>
                    Résoudre
                  </Button>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Replies */}
              <Typography variant="subtitle2" mb={1}>Échanges ({selectedDispute.replies?.length || 0})</Typography>
              {selectedDispute.replies && selectedDispute.replies.length > 0 ? (
                <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                  {selectedDispute.replies.map((r: DisputeReply) => (
                    <Box key={r.id} sx={{ mb: 1, p: 1.5, borderRadius: 1, bgcolor: r.user_role === 'admin' || r.user_role === 'support' ? 'primary.50' : 'grey.50', border: '1px solid', borderColor: r.user_role === 'admin' || r.user_role === 'support' ? 'primary.200' : 'grey.200' }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight="bold">
                          {r.user_role === 'admin' || r.user_role === 'support' ? '🛡️ Support' : r.user ? `${r.user.first_name} ${r.user.last_name}` : 'Utilisateur'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(r.created_at)}</Typography>
                      </Box>
                      <Typography variant="body2">{r.message}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" mb={2}>Aucun échange pour le moment.</Typography>
              )}

              {/* Reply form */}
              {['open', 'investigating'].includes(selectedDispute.status) && (
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth size="small" placeholder="Répondre au litige…"
                    value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)}
                    multiline maxRows={3}
                  />
                  <Button variant="contained" size="small" onClick={handleReply} disabled={replying || !replyMessage.trim()} startIcon={<SendIcon />}>
                    {replying ? <CircularProgress size={16} /> : 'Envoyer'}
                  </Button>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ─── Resolve Dialog ─── */}
      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Résoudre le litige</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Issue</InputLabel>
            <Select value={resolveOutcome} label="Issue" onChange={(e) => setResolveOutcome(e.target.value as ResolveOutcome)}>
              <MenuItem value="refund_customer">Rembourser le client (100%)</MenuItem>
              <MenuItem value="release_to_driver">Libérer les fonds au conducteur</MenuItem>
              <MenuItem value="split">Partage (montants personnalisés)</MenuItem>
            </Select>
          </FormControl>

          {resolveOutcome === 'split' && (
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Remboursement (cents)" type="number" size="small" fullWidth
                value={resolveRefundCents} onChange={(e) => setResolveRefundCents(Number(e.target.value))}
                helperText={`= ${formatCurrency(resolveRefundCents)}`}
              />
              <TextField
                label="Libéré conducteur (cents)" type="number" size="small" fullWidth
                value={resolveReleaseCents} onChange={(e) => setResolveReleaseCents(Number(e.target.value))}
                helperText={`= ${formatCurrency(resolveReleaseCents)}`}
              />
            </Box>
          )}

          <TextField
            label="Note de résolution" fullWidth multiline rows={3}
            value={resolveNote} onChange={(e) => setResolveNote(e.target.value)}
            placeholder="Expliquez la décision…"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveOpen(false)}>Annuler</Button>
          <Button variant="contained" color="warning" onClick={handleResolve} disabled={resolving}>
            {resolving ? <CircularProgress size={16} /> : 'Confirmer la résolution'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
