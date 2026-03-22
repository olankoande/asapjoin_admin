import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { contractsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', version: '', content: '' });

  const current = useQuery({
    queryKey: ['admin-contract-current'],
    queryFn: () => contractsApi.current().then((response) => response.data),
  });

  const history = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: () => contractsApi.list().then((response) => response.data),
  });

  useEffect(() => {
    if (current.data) {
      setForm({
        title: current.data.title,
        version: current.data.version,
        content: current.data.content,
      });
    }
  }, [current.data]);

  const saveMutation = useMutation({
    mutationFn: () => contractsApi.saveCurrent(form),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-contract-current'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-contracts'] }),
      ]);
      toast.success('Contrat publié');
    },
    onError: (error) => toast.error(getApiError(error).message),
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>Contrat & Conditions</Typography>

      {(current.error || history.error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiError(current.error || history.error).message}
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Contrat actif</Typography>
          {current.isLoading ? (
            <CircularProgress />
          ) : (
            <Stack spacing={2}>
              <TextField
                label="Titre"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Version"
                value={form.version}
                onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
                fullWidth
                helperText="Ex: 2026-03-21 ou v1.0"
              />
              <TextField
                label="Contenu"
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                fullWidth
                multiline
                minRows={16}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Publication...' : 'Publier le contrat'}
                </Button>
              </Box>
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Historique récent</Typography>
          {history.isLoading ? (
            <CircularProgress />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Titre</TableCell>
                    <TableCell>Actif</TableCell>
                    <TableCell>Créé le</TableCell>
                    <TableCell>Mis à jour</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(history.data ?? []).map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.version}</TableCell>
                      <TableCell>{contract.title}</TableCell>
                      <TableCell>{contract.is_active ? 'Oui' : 'Non'}</TableCell>
                      <TableCell>{new Date(contract.created_at).toLocaleString()}</TableCell>
                      <TableCell>{new Date(contract.updated_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
