import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiError } from '../../../api/httpClient';
import { useRoles } from '../hooks/useRoles';
import { rolesApi } from '../api/rolesApi';
import { useAuth } from '../../../auth/AuthProvider';

export default function RolesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useRoles(search);

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => rolesApi.remove(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      toast.success('Role supprime');
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  const roles = useMemo(() => data ?? [], [data]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roles</Typography>
        {can('roles.create') && (
          <Button variant="contained" onClick={() => navigate('/roles/new')}>
            Nouveau role
          </Button>
        )}
      </Box>

      <TextField label="Recherche" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ mb: 3, minWidth: 320 }} />

      {error && <Alert severity="error">{getApiError(error).message}</Alert>}

      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Systeme</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Utilisateurs</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.code}</TableCell>
                  <TableCell>{role.description || '-'}</TableCell>
                  <TableCell>{role.is_system ? <Chip label="Systeme" color="warning" size="small" /> : <Chip label="Custom" size="small" />}</TableCell>
                  <TableCell>{role._count?.role_permissions ?? 0}</TableCell>
                  <TableCell>{role._count?.user_roles ?? 0}</TableCell>
                  <TableCell align="right">
                    {can('roles.update') && <Button size="small" onClick={() => navigate(`/roles/${role.id}`)}>Editer</Button>}
                    {can('roles.delete') && !role.is_system && (
                      <Button size="small" color="error" onClick={() => deleteMutation.mutate(role.id)}>
                        Supprimer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
