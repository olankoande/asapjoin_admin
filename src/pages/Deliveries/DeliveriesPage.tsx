import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, TextField, Stack, Button } from '@mui/material';
import { deliveriesApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import StatusChip from '../../components/StatusChip';
import { formatDate, formatMoney } from '../../utils/format';

export default function DeliveriesPage() {
  const [sender, setSender] = useState('');
  const [date, setDate] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-deliveries', params],
    queryFn: () => deliveriesApi.list(Object.keys(params).length > 0 ? params : undefined).then(r => r.data),
  });

  const handleSearch = () => {
    const p: Record<string, string> = {};
    if (sender.trim()) p.sender = sender.trim();
    if (date) p.date = date;
    setParams(p);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Livraisons</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <TextField size="small" placeholder="Email expéditeur" value={sender} onChange={e => setSender(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} sx={{ minWidth: { xs: '100%', sm: 250 } }} />
        <TextField size="small" type="date" label="Date" value={date} onChange={e => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
        <Button variant="contained" onClick={handleSearch}>Rechercher</Button>
        {Object.keys(params).length > 0 && <Button variant="outlined" onClick={() => { setSender(''); setDate(''); setParams({}); }}>Réinitialiser</Button>}
      </Stack>
      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>ID</TableCell><TableCell>Expéditeur</TableCell><TableCell>Trajet</TableCell>
              <TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell>Date</TableCell>
            </TableRow></TableHead>
            <TableBody>{data?.map(d => (
              <TableRow key={d.id}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{String(d.id).slice(0, 8)}</TableCell>
                <TableCell>{d.sender?.email || String(d.sender_id).slice(0, 8)}</TableCell>
                <TableCell>{String(d.trip_id).slice(0, 8)}</TableCell>
                <TableCell>{formatMoney(Number(d.total_price))}</TableCell>
                <TableCell><StatusChip status={d.status} /></TableCell>
                <TableCell>{formatDate(d.created_at)}</TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && <TableRow><TableCell colSpan={6} align="center">Aucune livraison trouvée</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
