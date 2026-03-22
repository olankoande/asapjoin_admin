import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Button, TextField, Stack } from '@mui/material';
import { tripsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import StatusChip from '../../components/StatusChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate, formatMoney } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Trip } from '../../api/types';

export default function TripsPage() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<Trip | null>(null);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['admin-trips', searchParams],
    queryFn: () => tripsApi.list(Object.keys(searchParams).length > 0 ? searchParams : undefined).then(r => r.data),
  });

  const unpublish = useMutation({
    mutationFn: (id: string) => tripsApi.unpublish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-trips'] }); toast.success('Trajet dépublié'); setConfirm(null); },
    onError: (e) => { toast.error(getApiError(e).message); setConfirm(null); },
  });

  const handleSearch = () => {
    if (search.trim()) {
      setSearchParams({ search: search.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Trajets</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField
          size="small"
          placeholder="Rechercher par ville, conducteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: { xs: '100%', sm: 300 } }}
        />
        <Button variant="contained" onClick={handleSearch}>Rechercher</Button>
        {Object.keys(searchParams).length > 0 && (
          <Button variant="outlined" onClick={() => { setSearch(''); setSearchParams({}); }}>Réinitialiser</Button>
        )}
      </Stack>

      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Origine</TableCell><TableCell>Destination</TableCell><TableCell>Départ</TableCell>
              <TableCell>Places</TableCell><TableCell>Prix/place</TableCell><TableCell>Statut</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {trips?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.from_address || t.from_city || t.origin_address || '—'}</TableCell>
                  <TableCell>{t.to_address || t.to_city || t.destination_address || '—'}</TableCell>
                  <TableCell>{formatDate(t.departure_at ?? t.departure_time)}</TableCell>
                  <TableCell>{t.available_seats}</TableCell>
                  <TableCell>{formatMoney(Number(t.price_per_seat) || 0)}</TableCell>
                  <TableCell><StatusChip status={t.status} /></TableCell>
                  <TableCell>
                    {t.status === 'published' && <Button size="small" color="warning" onClick={() => setConfirm(t)}>Dépublier</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {trips?.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">Aucun trajet trouvé</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ConfirmDialog open={!!confirm} title="Dépublier trajet" message={`Dépublier le trajet ${confirm?.from_address || confirm?.from_city || '?'} → ${confirm?.to_address || confirm?.to_city || '?'} ?`}
        onConfirm={() => confirm && unpublish.mutate(confirm.id)} onCancel={() => setConfirm(null)} loading={unpublish.isPending} />
    </Box>
  );
}
