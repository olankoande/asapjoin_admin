import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  CircularProgress, Alert, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Divider, Stack, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { policiesApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';
import type { CancellationPolicy, CancellationPolicyRule } from '../../api/types';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount);
}

export default function PoliciesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState<CancellationPolicy | null>(null);
  const [form, setForm] = useState({ name: '', scope: 'booking' as 'booking' | 'delivery' });

  // Rule dialog
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleEditingId, setRuleEditingId] = useState<string | null>(null);
  const [rulePolicyId, setRulePolicyId] = useState<string>('');
  const [ruleForm, setRuleForm] = useState({
    min_hours_before_departure: 0,
    cancellation_fee_fixed: 0,
    cancellation_fee_percent: 0,
    refund_percent_to_payer: 100,
    debit_driver_percent: 0,
    apply_after_min_delay_hours: 0,
  });

  // Delete rule
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<{ policyId: string; ruleId: string } | null>(null);

  // Expanded policy
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: () => policiesApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: () => policiesApi.create({ name: form.name, scope: form.scope } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('Politique créée');
      setCreateOpen(false);
      setForm({ name: '', scope: 'booking' });
    },
    onError: (e) => toast.error(getApiError(e).message),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => policiesApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('Politique activée');
      setActivateTarget(null);
    },
    onError: (e) => { toast.error(getApiError(e).message); setActivateTarget(null); },
  });

  const addRuleMut = useMutation({
    mutationFn: () => policiesApi.addRule(rulePolicyId, ruleForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('Règle ajoutée');
      setRuleDialogOpen(false);
    },
    onError: (e) => toast.error(getApiError(e).message),
  });

  const updateRuleMut = useMutation({
    mutationFn: () => policiesApi.updateRule(rulePolicyId, ruleEditingId!, ruleForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('Règle mise à jour');
      setRuleDialogOpen(false);
    },
    onError: (e) => toast.error(getApiError(e).message),
  });

  const deleteRuleMut = useMutation({
    mutationFn: ({ policyId, ruleId }: { policyId: string; ruleId: string }) =>
      policiesApi.deleteRule(policyId, ruleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-policies'] });
      toast.success('Règle supprimée');
      setDeleteRuleTarget(null);
    },
    onError: (e) => { toast.error(getApiError(e).message); setDeleteRuleTarget(null); },
  });

  const openAddRule = (policyId: string) => {
    setRulePolicyId(policyId);
    setRuleEditingId(null);
    setRuleForm({
      min_hours_before_departure: 0,
      cancellation_fee_fixed: 0,
      cancellation_fee_percent: 0,
      refund_percent_to_payer: 100,
      debit_driver_percent: 0,
      apply_after_min_delay_hours: 0,
    });
    setRuleDialogOpen(true);
  };

  const openEditRule = (policyId: string, rule: CancellationPolicyRule) => {
    setRulePolicyId(policyId);
    setRuleEditingId(rule.id);
    setRuleForm({
      min_hours_before_departure: rule.min_hours_before_departure,
      cancellation_fee_fixed: rule.cancellation_fee_fixed,
      cancellation_fee_percent: rule.cancellation_fee_percent,
      refund_percent_to_payer: rule.refund_percent_to_payer,
      debit_driver_percent: rule.debit_driver_percent,
      apply_after_min_delay_hours: rule.apply_after_min_delay_hours,
    });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (ruleEditingId) {
      updateRuleMut.mutate();
    } else {
      addRuleMut.mutate();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Politiques d'annulation</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Nouvelle politique
        </Button>
      </Box>

      {/* Explanation */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Politiques d'annulation Prisma :</strong> Chaque politique contient des <em>règles</em> basées sur le nombre d'heures avant le départ.
          Lors d'une annulation, la règle correspondante détermine les frais et le pourcentage de remboursement.
          Une seule politique peut être active par scope (réservation/livraison).
        </Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <Box>
          {data?.map((p: CancellationPolicy) => (
            <Paper key={p.id} sx={{
              mb: 2,
              border: '1px solid',
              borderColor: p.active ? 'success.main' : 'divider',
              borderWidth: p.active ? 2 : 1,
            }}>
              {/* Policy header */}
              <Box
                sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">{p.name}</Typography>
                  <Chip label={p.scope === 'booking' ? 'Réservation' : 'Livraison'} size="small" color="primary" variant="outlined" />
                  {p.active ? (
                    <Chip label="Active" color="success" size="small" icon={<CheckCircleIcon />} />
                  ) : (
                    <Chip label="Inactive" size="small" />
                  )}
                  <Chip label={`${p.rules?.length || 0} règle(s)`} size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!p.active && (
                    <Button size="small" color="success" variant="outlined" onClick={(e) => { e.stopPropagation(); setActivateTarget(p); }}>
                      Activer
                    </Button>
                  )}
                  <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openAddRule(p.id); }}>
                    + Règle
                  </Button>
                </Box>
              </Box>

              {/* Rules table (expanded) */}
              {expandedId === p.id && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  {(!p.rules || p.rules.length === 0) ? (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Aucune règle. Ajoutez des règles pour définir les frais d'annulation selon le délai avant le départ.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Min heures avant départ</TableCell>
                            <TableCell>Frais fixes</TableCell>
                            <TableCell>Frais %</TableCell>
                            <TableCell>% remboursement</TableCell>
                            <TableCell>% débit conducteur</TableCell>
                            <TableCell>Délai min (h)</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {p.rules.map((rule: CancellationPolicyRule) => (
                            <TableRow key={rule.id} hover>
                              <TableCell>
                                <Typography fontWeight="bold">{rule.min_hours_before_departure}h</Typography>
                              </TableCell>
                              <TableCell>{formatCurrency(rule.cancellation_fee_fixed)}</TableCell>
                              <TableCell>{rule.cancellation_fee_percent}%</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${rule.refund_percent_to_payer}%`}
                                  size="small"
                                  color={rule.refund_percent_to_payer >= 100 ? 'success' : rule.refund_percent_to_payer > 0 ? 'warning' : 'error'}
                                />
                              </TableCell>
                              <TableCell>{rule.debit_driver_percent}%</TableCell>
                              <TableCell>{rule.apply_after_min_delay_hours}h</TableCell>
                              <TableCell>
                                <Tooltip title="Modifier">
                                  <IconButton size="small" onClick={() => openEditRule(p.id, rule)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer">
                                  <IconButton size="small" color="error" onClick={() => setDeleteRuleTarget({ policyId: p.id, ruleId: rule.id })}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  <Button size="small" startIcon={<AddIcon />} onClick={() => openAddRule(p.id)} sx={{ mt: 1 }}>
                    Ajouter une règle
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* ─── Create Policy Dialog ─── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle politique</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nom"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            placeholder="Ex: Politique standard réservations"
          />
          <FormControl fullWidth>
            <InputLabel>Scope</InputLabel>
            <Select
              value={form.scope}
              label="Scope"
              onChange={e => setForm(f => ({ ...f, scope: e.target.value as any }))}
            >
              <MenuItem value="booking">Réservation</MenuItem>
              <MenuItem value="delivery">Livraison</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.name}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Add/Edit Rule Dialog ─── */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{ruleEditingId ? 'Modifier la règle' : 'Ajouter une règle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Définissez les conditions et les frais pour cette tranche horaire.
              La règle s'applique quand l'annulation est faite au moins <strong>X heures</strong> avant le départ.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Min heures avant départ"
                  type="number"
                  value={ruleForm.min_hours_before_departure}
                  onChange={e => setRuleForm(f => ({ ...f, min_hours_before_departure: Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Ex: 24 = s'applique si annulation ≥24h avant départ"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Délai min après réservation (h)"
                  type="number"
                  value={ruleForm.apply_after_min_delay_hours}
                  onChange={e => setRuleForm(f => ({ ...f, apply_after_min_delay_hours: Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="0 = pas de délai minimum"
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Frais d'annulation</Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Frais fixes ($)"
                  type="number"
                  value={ruleForm.cancellation_fee_fixed}
                  onChange={e => setRuleForm(f => ({ ...f, cancellation_fee_fixed: Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText={`= ${formatCurrency(ruleForm.cancellation_fee_fixed)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Frais en % du montant"
                  type="number"
                  value={ruleForm.cancellation_fee_percent}
                  onChange={e => setRuleForm(f => ({ ...f, cancellation_fee_percent: Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Remboursement & Conducteur</Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="% remboursement au payeur"
                  type="number"
                  value={ruleForm.refund_percent_to_payer}
                  onChange={e => setRuleForm(f => ({ ...f, refund_percent_to_payer: Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText="100 = remboursement total (après frais)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="% débit conducteur"
                  type="number"
                  value={ruleForm.debit_driver_percent}
                  onChange={e => setRuleForm(f => ({ ...f, debit_driver_percent: Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText="Pourcentage débité du wallet conducteur"
                />
              </Grid>
            </Grid>

            {/* Simulation */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Simulation (montant de 50,00 $)</Typography>
              {(() => {
                const gross = 50;
                const fixedFee = ruleForm.cancellation_fee_fixed;
                const percentFee = gross * ruleForm.cancellation_fee_percent / 100;
                const totalFee = Math.min(fixedFee + percentFee, gross);
                const afterFee = Math.max(0, gross - totalFee);
                const refund = afterFee * ruleForm.refund_percent_to_payer / 100;
                return (
                  <Typography variant="body2" color="text.secondary">
                    Frais : {formatCurrency(totalFee)} — Remboursement : {formatCurrency(refund)} — Retenu : {formatCurrency(gross - refund)}
                  </Typography>
                );
              })()}
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSaveRule}
            disabled={addRuleMut.isPending || updateRuleMut.isPending}
          >
            {(addRuleMut.isPending || updateRuleMut.isPending) ? <CircularProgress size={16} /> : ruleEditingId ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Activate Confirm ─── */}
      <ConfirmDialog
        open={!!activateTarget}
        title="Activer politique"
        message={`Activer la politique "${activateTarget?.name}" ? Cela désactivera les autres politiques du même scope (${activateTarget?.scope}).`}
        onConfirm={() => activateTarget && activateMut.mutate(activateTarget.id)}
        onCancel={() => setActivateTarget(null)}
        loading={activateMut.isPending}
      />

      {/* ─── Delete Rule Confirm ─── */}
      <ConfirmDialog
        open={!!deleteRuleTarget}
        title="Supprimer la règle"
        message="Êtes-vous sûr de vouloir supprimer cette règle ?"
        onConfirm={() => deleteRuleTarget && deleteRuleMut.mutate(deleteRuleTarget)}
        onCancel={() => setDeleteRuleTarget(null)}
        loading={deleteRuleMut.isPending}
      />
    </Box>
  );
}
