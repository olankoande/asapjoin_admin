import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { reportsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import StatusChip from '../../components/StatusChip';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const qc = useQueryClient();
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [form, setForm] = useState({ status: 'resolved', resolution: '' });
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-reports'], queryFn: () => reportsApi.list().then(r => r.data) });

  const resolve = useMutation({
    mutationFn: () => reportsApi.resolve(resolveId!, { status: form.status, resolution: form.resolution || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reports'] }); toast.success('Signalement traité'); setResolveId(null); },
    onError: (e) => toast.error(getApiError(e).message),
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>Signalements</Typography>
      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow>
            <TableCell>ID</TableCell><TableCell>Rapporteur</TableCell><TableCell>Signalé</TableCell>
            <TableCell>Raison</TableCell><TableCell>Statut</TableCell><TableCell>Créé le</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>{data?.map(r => (
            <TableRow key={r.id}>
              <TableCell>{String(r.id).slice(0,8)}</TableCell>
              <TableCell>{r.reporter?.email || String(r.reporter_id).slice(0,8)}</TableCell>
              <TableCell>{(r as any).reported?.email || String((r as any).target_id ?? r.reported_id ?? '—').slice(0,8)}</TableCell>
              <TableCell>{r.reason}</TableCell>
              <TableCell><StatusChip status={r.status} /></TableCell>
              <TableCell>{formatDate(r.created_at)}</TableCell>
              <TableCell>
                {(r.status === 'pending' || r.status === 'open') && <Button size="small" onClick={() => setResolveId(String(r.id))}>Traiter</Button>}
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
      <Dialog open={!!resolveId} onClose={() => setResolveId(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Traiter signalement</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField select label="Décision" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <MenuItem value="resolved">Résolu</MenuItem>
            <MenuItem value="dismissed">Rejeté</MenuItem>
          </TextField>
          <TextField label="Résolution / commentaire" value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))} multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveId(null)}>Annuler</Button>
          <Button variant="contained" onClick={() => resolve.mutate()} disabled={resolve.isPending}>Confirmer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
