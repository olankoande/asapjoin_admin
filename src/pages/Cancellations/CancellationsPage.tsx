import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Alert, Tabs, Tab, IconButton, Tooltip,
  Grid, Divider, Card, CardContent, CardActions, Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { adminCancellationsApi, type CancellationRequest, type RefundOverrideInput } from '../../features/disputes/api/adminDisputesApi';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  refunded: 'success',
  approved: 'info',
  pending: 'warning',
  rejected: 'error',
};

export default function CancellationsPage() {
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Override dialog
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideType, setOverrideType] = useState<'booking' | 'delivery'>('booking');
  const [overrideResourceId, setOverrideResourceId] = useState('');
  const [overrideAmount, setOverrideAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideResult, setOverrideResult] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.resource_type = typeFilter;
      const res = await adminCancellationsApi.list(params);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter, typeFilter]);

  const handleOverride = async () => {
    if (!overrideResourceId || overrideAmount <= 0) {
      setError('ID de ressource et montant requis');
      return;
    }
    setOverrideLoading(true);
    setOverrideResult('');
    try {
      const body: RefundOverrideInput = {
        resource_type: overrideType,
        resource_id: overrideResourceId,
        refund_amount_cents: overrideAmount,
        reason: overrideReason || undefined,
      };
      const res = await adminCancellationsApi.refundOverride(body);
      setOverrideResult(`Remboursement effectué : ${formatCurrency((res.data as any).refund_amount_cents || overrideAmount)}`);
      fetchRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du remboursement');
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Annulations & Remboursements</Typography>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} onClick={fetchRequests} variant="outlined" size="small">Actualiser</Button>
          <Button variant="contained" size="small" color="warning" onClick={() => { setOverrideOpen(true); setOverrideResult(''); }}>
            Remboursement manuel
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Demandes d'annulation" />
        <Tab label="Politiques de remboursement" />
      </Tabs>

      {tab === 0 && (
        <>
          {/* Filters */}
          <Box display="flex" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="refunded">Remboursé</MenuItem>
                <MenuItem value="approved">Approuvé</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="booking">Réservation</MenuItem>
                <MenuItem value="delivery">Livraison</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Réf.</TableCell>
                  <TableCell>Acteur</TableCell>
                  <TableCell>Montant original</TableCell>
                  <TableCell>Remboursement</TableCell>
                  <TableCell>Frais</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Admin?</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={10} align="center">Aucune demande d'annulation</TableCell></TableRow>
                ) : requests.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{String(r.id).slice(0, 8)}</TableCell>
                    <TableCell><Chip label={r.resource_type === 'booking' ? 'Réservation' : 'Livraison'} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{String(r.resource_id).slice(0, 8)}</TableCell>
                    <TableCell>
                      <Chip label={r.actor_role} size="small" color={r.actor_role === 'admin' ? 'error' : r.actor_role === 'driver' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell>{formatCurrency(r.original_amount_cents)}</TableCell>
                    <TableCell sx={{ color: r.calculated_refund_cents > 0 ? 'success.main' : 'text.secondary', fontWeight: 'bold' }}>
                      {formatCurrency(r.calculated_refund_cents)}
                    </TableCell>
                    <TableCell sx={{ color: r.calculated_fee_cents > 0 ? 'error.main' : 'text.secondary' }}>
                      {formatCurrency(r.calculated_fee_cents)}
                    </TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell>
                    <TableCell>{r.is_admin_override ? <Chip label="Admin" size="small" color="error" /> : '—'}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{formatDate(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tab === 1 && <RefundPoliciesTab />}

      {/* ─── Override Dialog ─── */}
      <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remboursement manuel (Admin Override)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Forcer un remboursement sur une réservation ou livraison, indépendamment des politiques.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Type de ressource</InputLabel>
            <Select value={overrideType} label="Type de ressource" onChange={(e) => setOverrideType(e.target.value as 'booking' | 'delivery')}>
              <MenuItem value="booking">Réservation</MenuItem>
              <MenuItem value="delivery">Livraison</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="ID de la ressource" fullWidth sx={{ mb: 2 }}
            value={overrideResourceId} onChange={(e) => setOverrideResourceId(e.target.value)}
            placeholder="Ex: 12345"
          />

          <TextField
            label="Montant à rembourser (cents)" type="number" fullWidth sx={{ mb: 2 }}
            value={overrideAmount} onChange={(e) => setOverrideAmount(Number(e.target.value))}
            helperText={`= ${formatCurrency(overrideAmount)}`}
          />

          <TextField
            label="Raison" fullWidth multiline rows={2}
            value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Raison du remboursement admin…"
          />

          {overrideResult && <Alert severity="success" sx={{ mt: 2 }}>{overrideResult}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideOpen(false)}>Annuler</Button>
          <Button variant="contained" color="warning" onClick={handleOverride} disabled={overrideLoading}>
            {overrideLoading ? <CircularProgress size={16} /> : 'Rembourser'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Types ───

interface RefundPolicyForm {
  resource_type: 'booking' | 'delivery';
  actor_role: 'passenger' | 'sender' | 'driver' | 'admin';
  name: string;
  min_hours_before_departure: number;
  refund_request_deadline_hours: number;
  cancellation_fee_fixed_cents: number;
  cancellation_fee_percent: number;
  refund_percent_to_customer: number;
  driver_compensation_percent: number;
  applies_when_statuses: string;
  priority: number;
  notes: string;
}

const emptyForm: RefundPolicyForm = {
  resource_type: 'booking',
  actor_role: 'passenger',
  name: '',
  min_hours_before_departure: 0,
  refund_request_deadline_hours: 0,
  cancellation_fee_fixed_cents: 0,
  cancellation_fee_percent: 0,
  refund_percent_to_customer: 100,
  driver_compensation_percent: 0,
  applies_when_statuses: 'pending,accepted,paid',
  priority: 0,
  notes: '',
};

const RESOURCE_TYPES = [
  { value: 'booking', label: 'Réservation' },
  { value: 'delivery', label: 'Livraison' },
];

const ACTOR_ROLES = [
  { value: 'passenger', label: 'Passager' },
  { value: 'sender', label: 'Expéditeur' },
  { value: 'driver', label: 'Conducteur' },
  { value: 'admin', label: 'Admin' },
];

const BOOKING_STATUSES = ['pending', 'accepted', 'paid', 'completed'];
const DELIVERY_STATUSES = ['pending', 'accepted', 'paid', 'in_transit', 'delivered'];

function getAvailableStatuses(resourceType: string) {
  return resourceType === 'delivery' ? DELIVERY_STATUSES : BOOKING_STATUSES;
}

function getAvailableRoles(resourceType: string) {
  if (resourceType === 'delivery') {
    return ACTOR_ROLES.filter(r => ['sender', 'driver', 'admin'].includes(r.value));
  }
  return ACTOR_ROLES.filter(r => ['passenger', 'driver', 'admin'].includes(r.value));
}

// ─── Refund Policies Sub-Tab ───

function RefundPoliciesTab() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RefundPolicyForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Filter
  const [filterType, setFilterType] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filterType) params.resource_type = filterType;
      if (filterRole) params.actor_role = filterRole;
      const res = await adminCancellationsApi.listPolicies(params);
      setPolicies(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des politiques');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterRole]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (policy: any) => {
    setEditingId(policy.id);
    setForm({
      resource_type: policy.resource_type,
      actor_role: policy.actor_role,
      name: policy.name,
      min_hours_before_departure: policy.min_hours_before_departure ?? 0,
      refund_request_deadline_hours: policy.refund_request_deadline_hours ?? 0,
      cancellation_fee_fixed_cents: policy.cancellation_fee_fixed_cents ?? 0,
      cancellation_fee_percent: policy.cancellation_fee_percent ?? 0,
      refund_percent_to_customer: policy.refund_percent_to_customer ?? 100,
      driver_compensation_percent: policy.driver_compensation_percent ?? 0,
      applies_when_statuses: policy.applies_when_statuses ?? 'pending,accepted,paid',
      priority: policy.priority ?? 0,
      notes: policy.notes ?? '',
    });
    setDialogOpen(true);
  };

  const openDuplicate = (policy: any) => {
    setEditingId(null);
    setForm({
      resource_type: policy.resource_type,
      actor_role: policy.actor_role,
      name: `${policy.name} (copie)`,
      min_hours_before_departure: policy.min_hours_before_departure ?? 0,
      refund_request_deadline_hours: policy.refund_request_deadline_hours ?? 0,
      cancellation_fee_fixed_cents: policy.cancellation_fee_fixed_cents ?? 0,
      cancellation_fee_percent: policy.cancellation_fee_percent ?? 0,
      refund_percent_to_customer: policy.refund_percent_to_customer ?? 100,
      driver_compensation_percent: policy.driver_compensation_percent ?? 0,
      applies_when_statuses: policy.applies_when_statuses ?? 'pending,accepted,paid',
      priority: policy.priority ?? 0,
      notes: policy.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!form.applies_when_statuses.trim()) {
      setError('Les statuts applicables sont requis');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await adminCancellationsApi.updatePolicy(editingId, {
          name: form.name,
          min_hours_before_departure: form.min_hours_before_departure,
          refund_request_deadline_hours: form.refund_request_deadline_hours,
          cancellation_fee_fixed_cents: form.cancellation_fee_fixed_cents,
          cancellation_fee_percent: form.cancellation_fee_percent,
          refund_percent_to_customer: form.refund_percent_to_customer,
          driver_compensation_percent: form.driver_compensation_percent,
          applies_when_statuses: form.applies_when_statuses,
          priority: form.priority,
          notes: form.notes || null,
        });
        setSuccess('Politique mise à jour avec succès');
      } else {
        await adminCancellationsApi.createPolicy({
          resource_type: form.resource_type,
          actor_role: form.actor_role,
          name: form.name,
          min_hours_before_departure: form.min_hours_before_departure,
          refund_request_deadline_hours: form.refund_request_deadline_hours,
          cancellation_fee_fixed_cents: form.cancellation_fee_fixed_cents,
          cancellation_fee_percent: form.cancellation_fee_percent,
          refund_percent_to_customer: form.refund_percent_to_customer,
          driver_compensation_percent: form.driver_compensation_percent,
          applies_when_statuses: form.applies_when_statuses,
          priority: form.priority,
          notes: form.notes || undefined,
        });
        setSuccess('Politique créée avec succès');
      }
      setDialogOpen(false);
      fetchPolicies();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await adminCancellationsApi.deactivatePolicy(id);
        setSuccess('Politique désactivée');
      } else {
        await adminCancellationsApi.activatePolicy(id);
        setSuccess('Politique activée');
      }
      fetchPolicies();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur');
    }
  };

  const updateField = <K extends keyof RefundPolicyForm>(key: K, value: RefundPolicyForm[K]) => {
    setForm(f => {
      const updated = { ...f, [key]: value };
      // Auto-adjust actor_role when resource_type changes
      if (key === 'resource_type') {
        const roles = getAvailableRoles(value as string);
        if (!roles.find(r => r.value === updated.actor_role)) {
          updated.actor_role = roles[0].value as any;
        }
      }
      return updated;
    });
  };

  // Toggle a status in the CSV
  const toggleStatus = (status: string) => {
    const current = form.applies_when_statuses.split(',').map(s => s.trim()).filter(Boolean);
    const idx = current.indexOf(status);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(status);
    }
    updateField('applies_when_statuses', current.join(','));
  };

  const selectedStatuses = form.applies_when_statuses.split(',').map(s => s.trim()).filter(Boolean);

  // Group policies by resource_type + actor_role
  const grouped = policies.reduce((acc: Record<string, any[]>, p: any) => {
    const key = `${p.resource_type}|${p.actor_role}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (loading) return <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="booking">Réservation</MenuItem>
              <MenuItem value="delivery">Livraison</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Rôle</InputLabel>
            <Select value={filterRole} label="Rôle" onChange={(e) => setFilterRole(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="passenger">Passager</MenuItem>
              <MenuItem value="sender">Expéditeur</MenuItem>
              <MenuItem value="driver">Conducteur</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} onClick={fetchPolicies} variant="outlined" size="small">Actualiser</Button>
          <Button startIcon={<AddIcon />} onClick={openCreate} variant="contained" size="small">Nouvelle politique</Button>
        </Box>
      </Box>

      {/* Explanation */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Comment ça marche :</strong> Lors d'une annulation, le système cherche la politique active correspondant au <em>type de ressource</em> (réservation/livraison),
          au <em>rôle de l'acteur</em> (passager/conducteur/etc.), au <em>statut actuel</em> de la ressource, et au <em>nombre d'heures avant le départ</em>.
          La politique avec la <strong>priorité la plus élevée</strong> qui correspond est appliquée.
          Les frais d'annulation et le pourcentage de remboursement sont calculés automatiquement.
        </Typography>
      </Paper>

      {/* Policies grouped by type/role */}
      {Object.keys(grouped).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Aucune politique configurée. Créez-en une pour commencer.</Typography>
        </Paper>
      ) : (
        Object.entries(grouped).map(([key, groupPolicies]) => {
          const [resType, actRole] = key.split('|');
          const typeLabel = RESOURCE_TYPES.find(t => t.value === resType)?.label || resType;
          const roleLabel = ACTOR_ROLES.find(r => r.value === actRole)?.label || actRole;

          return (
            <Box key={key} mb={3}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={typeLabel} size="small" color="primary" variant="outlined" />
                <Chip label={roleLabel} size="small" color="secondary" variant="outlined" />
                <Typography variant="body2" color="text.secondary" component="span">
                  — {groupPolicies.length} politique(s)
                </Typography>
              </Typography>

              <Grid container spacing={2}>
                {groupPolicies
                  .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0))
                  .map((p: any) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={p.id}>
                    <Card variant="outlined" sx={{
                      borderColor: p.active ? 'success.main' : 'divider',
                      borderWidth: p.active ? 2 : 1,
                      opacity: p.active ? 1 : 0.7,
                    }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                            {p.name}
                          </Typography>
                          <Chip
                            label={p.active ? 'Active' : 'Inactive'}
                            size="small"
                            color={p.active ? 'success' : 'default'}
                            icon={p.active ? <CheckCircleIcon /> : <CancelIcon />}
                          />
                        </Box>

                        {p.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                            {p.notes}
                          </Typography>
                        )}

                        <Divider sx={{ my: 1 }} />

                        <Grid container spacing={1}>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Priorité</Typography>
                            <Typography variant="body2" fontWeight="bold">{p.priority}</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Min heures avant départ</Typography>
                            <Typography variant="body2" fontWeight="bold">{p.min_hours_before_departure}h</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">% remboursement client</Typography>
                            <Typography variant="body2" fontWeight="bold" color="success.main">{p.refund_percent_to_customer}%</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Frais fixes</Typography>
                            <Typography variant="body2" fontWeight="bold" color="error.main">
                              {formatCurrency(p.cancellation_fee_fixed_cents || 0)}
                            </Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">% frais</Typography>
                            <Typography variant="body2" fontWeight="bold" color="error.main">{p.cancellation_fee_percent}%</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">% compensation conducteur</Typography>
                            <Typography variant="body2" fontWeight="bold">{p.driver_compensation_percent}%</Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Délai demande remb.</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {p.refund_request_deadline_hours > 0 ? `${p.refund_request_deadline_hours}h` : 'Illimité'}
                            </Typography>
                          </Grid>
                          <Grid size={6}>
                            <Typography variant="caption" color="text.secondary">Statuts applicables</Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                              {(p.applies_when_statuses || '').split(',').filter(Boolean).map((s: string) => (
                                <Chip key={s} label={s.trim()} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                              ))}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                        <Tooltip title="Dupliquer">
                          <IconButton size="small" onClick={() => openDuplicate(p)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => openEdit(p)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          color={p.active ? 'error' : 'success'}
                          onClick={() => toggleActive(p.id, p.active)}
                        >
                          {p.active ? 'Désactiver' : 'Activer'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })
      )}

      {/* ─── Create/Edit Dialog ─── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Modifier la politique de remboursement' : 'Nouvelle politique de remboursement'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Basic info */}
            <TextField
              label="Nom de la politique"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              fullWidth
              placeholder="Ex: Passager >24h avant départ"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth disabled={!!editingId}>
                  <InputLabel>Type de ressource</InputLabel>
                  <Select
                    value={form.resource_type}
                    label="Type de ressource"
                    onChange={(e) => updateField('resource_type', e.target.value as any)}
                  >
                    {RESOURCE_TYPES.map(t => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth disabled={!!editingId}>
                  <InputLabel>Rôle de l'acteur</InputLabel>
                  <Select
                    value={form.actor_role}
                    label="Rôle de l'acteur"
                    onChange={(e) => updateField('actor_role', e.target.value as any)}
                  >
                    {getAvailableRoles(form.resource_type).map(r => (
                      <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider />

            {/* Time windows */}
            <Typography variant="subtitle2" color="text.secondary">Fenêtres de temps</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Min heures avant départ"
                  type="number"
                  value={form.min_hours_before_departure}
                  onChange={(e) => updateField('min_hours_before_departure', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Cette politique s'applique si l'annulation est faite au moins X heures avant le départ"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Délai max demande remboursement (heures)"
                  type="number"
                  value={form.refund_request_deadline_hours}
                  onChange={(e) => updateField('refund_request_deadline_hours', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="0 = pas de limite. Sinon, nombre d'heures après l'événement pour demander"
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Fees */}
            <Typography variant="subtitle2" color="text.secondary">Frais d'annulation</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Frais fixes (cents)"
                  type="number"
                  value={form.cancellation_fee_fixed_cents}
                  onChange={(e) => updateField('cancellation_fee_fixed_cents', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText={`= ${formatCurrency(form.cancellation_fee_fixed_cents)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Frais en pourcentage (%)"
                  type="number"
                  value={form.cancellation_fee_percent}
                  onChange={(e) => updateField('cancellation_fee_percent', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText="Pourcentage du montant brut prélevé comme frais"
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Refund */}
            <Typography variant="subtitle2" color="text.secondary">Remboursement & Compensation</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="% remboursement client"
                  type="number"
                  value={form.refund_percent_to_customer}
                  onChange={(e) => updateField('refund_percent_to_customer', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText="Pourcentage du montant (après frais) remboursé au client"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="% compensation conducteur"
                  type="number"
                  value={form.driver_compensation_percent}
                  onChange={(e) => updateField('driver_compensation_percent', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText="Pourcentage du net conducteur conservé en compensation"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Priorité"
                  type="number"
                  value={form.priority}
                  onChange={(e) => updateField('priority', Number(e.target.value))}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Plus élevé = plus prioritaire"
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Statuses */}
            <Typography variant="subtitle2" color="text.secondary">
              Statuts applicables
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (la politique ne s'applique que si la ressource est dans un de ces statuts)
              </Typography>
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {getAvailableStatuses(form.resource_type).map(status => (
                <Chip
                  key={status}
                  label={status}
                  onClick={() => toggleStatus(status)}
                  color={selectedStatuses.includes(status) ? 'primary' : 'default'}
                  variant={selectedStatuses.includes(status) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Sélection actuelle : <code>{form.applies_when_statuses || '(aucun)'}</code>
            </Typography>

            <Divider />

            {/* Notes */}
            <TextField
              label="Notes (optionnel)"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="Description interne de cette politique…"
            />

            {/* Preview */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Aperçu du comportement</Typography>
              <Typography variant="body2" color="text.secondary">
                {form.actor_role === 'admin' ? (
                  <>L'admin peut toujours annuler, quel que soit le délai.</>
                ) : (
                  <>
                    Si un <strong>{ACTOR_ROLES.find(r => r.value === form.actor_role)?.label}</strong> annule
                    une <strong>{RESOURCE_TYPES.find(t => t.value === form.resource_type)?.label?.toLowerCase()}</strong> au
                    moins <strong>{form.min_hours_before_departure}h</strong> avant le départ,
                    quand le statut est <strong>{form.applies_when_statuses || '—'}</strong> :
                  </>
                )}
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {form.cancellation_fee_fixed_cents > 0 && (
                  <li><Typography variant="body2">Frais fixes : <strong>{formatCurrency(form.cancellation_fee_fixed_cents)}</strong></Typography></li>
                )}
                {form.cancellation_fee_percent > 0 && (
                  <li><Typography variant="body2">Frais en % : <strong>{form.cancellation_fee_percent}%</strong> du montant brut</Typography></li>
                )}
                <li>
                  <Typography variant="body2">
                    Remboursement client : <strong>{form.refund_percent_to_customer}%</strong> du montant après frais
                    {form.refund_percent_to_customer === 0 && ' (aucun remboursement)'}
                    {form.refund_percent_to_customer === 100 && ' (remboursement total après frais)'}
                  </Typography>
                </li>
                {form.driver_compensation_percent > 0 && (
                  <li><Typography variant="body2">Compensation conducteur : <strong>{form.driver_compensation_percent}%</strong> de son net</Typography></li>
                )}
                {form.refund_request_deadline_hours > 0 && (
                  <li><Typography variant="body2">Délai de demande : <strong>{form.refund_request_deadline_hours}h</strong> après l'événement</Typography></li>
                )}
              </Box>

              {/* Simulation example */}
              {(() => {
                const exampleGross = 5000; // 50$
                const fixedFee = form.cancellation_fee_fixed_cents;
                const percentFee = Math.round(exampleGross * form.cancellation_fee_percent / 100);
                const totalFee = Math.min(fixedFee + percentFee, exampleGross);
                const afterFee = Math.max(0, exampleGross - totalFee);
                const refund = Math.round(afterFee * form.refund_percent_to_customer / 100);

                return (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Simulation</strong> pour un montant de {formatCurrency(exampleGross)} :
                    </Typography>
                    <Typography variant="caption" display="block">
                      Frais : {formatCurrency(totalFee)} — Remboursement : {formatCurrency(refund)} — Retenu par la plateforme : {formatCurrency(exampleGross - refund)}
                    </Typography>
                  </Box>
                );
              })()}
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? <CircularProgress size={16} /> : editingId ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
