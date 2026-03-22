import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, TextField, Stack, Button } from '@mui/material';
import { bookingsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import StatusChip from '../../components/StatusChip';
import { formatDate, formatMoney } from '../../utils/format';

export default function BookingsPage() {
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-bookings', params],
    queryFn: () => bookingsApi.list(Object.keys(params).length > 0 ? params : undefined).then(r => r.data),
  });

  const handleSearch = () => {
    const p: Record<string, string> = {};
    if (email.trim()) p.email = email.trim();
    if (date) p.date = date;
    setParams(p);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Réservations</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <TextField size="small" placeholder="Email passager" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} sx={{ minWidth: { xs: '100%', sm: 250 } }} />
        <TextField size="small" type="date" label="Date" value={date} onChange={e => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
        <Button variant="contained" onClick={handleSearch}>Rechercher</Button>
        {Object.keys(params).length > 0 && <Button variant="outlined" onClick={() => { setEmail(''); setDate(''); setParams({}); }}>Réinitialiser</Button>}
      </Stack>
      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>ID</TableCell><TableCell>Passager</TableCell><TableCell>Trajet</TableCell>
              <TableCell>Places</TableCell><TableCell>Total</TableCell><TableCell>Statut</TableCell><TableCell>Date</TableCell>
            </TableRow></TableHead>
            <TableBody>{data?.map(b => (
              <TableRow key={b.id}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{String(b.id).slice(0, 8)}</TableCell>
                <TableCell>{b.passenger?.email || String(b.passenger_id).slice(0, 8)}</TableCell>
                <TableCell>{String(b.trip_id).slice(0, 8)}</TableCell>
                <TableCell>{b.seats_booked}</TableCell>
                <TableCell>{formatMoney(Number(b.total_price))}</TableCell>
                <TableCell><StatusChip status={b.status} /></TableCell>
                <TableCell>{formatDate(b.created_at)}</TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && <TableRow><TableCell colSpan={7} align="center">Aucune réservation trouvée</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
