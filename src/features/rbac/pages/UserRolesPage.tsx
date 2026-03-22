import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiError } from '../../../api/httpClient';
import { useUserRoles } from '../hooks/useUserRoles';
import AssignRoleDialog from '../components/AssignRoleDialog';
import { userRolesApi } from '../api/userRolesApi';

export default function UserRolesPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useUserRoles(id);

  const assignedRoleIds = useMemo(() => data?.roles.filter((role) => role.assigned).map((role) => role.id) ?? [], [data]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(assignedRoleIds);

  const mutation = useMutation({
    mutationFn: (roleIds: string[]) => userRolesApi.replace(id, roleIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rbac-user-roles', id] });
      toast.success('Roles utilisateur mis a jour');
      setOpen(false);
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  if (error) return <Alert severity="error">{getApiError(error).message}</Alert>;
  if (isLoading || !data) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roles utilisateur</Typography>
        <Button variant="contained" onClick={() => { setSelectedRoleIds(assignedRoleIds); setOpen(true); }}>
          Modifier
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">{data.user.first_name} {data.user.last_name}</Typography>
        <Typography color="text.secondary" mb={2}>{data.user.email}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {data.roles.filter((role) => role.assigned).map((role) => (
            <Chip key={role.id} label={role.name} color={role.is_system ? 'warning' : 'default'} />
          ))}
        </Stack>
      </Paper>

      <AssignRoleDialog
        open={open}
        roles={data.roles}
        selectedRoleIds={selectedRoleIds}
        onClose={() => setOpen(false)}
        onChange={setSelectedRoleIds}
        onConfirm={() => mutation.mutate(selectedRoleIds)}
        loading={mutation.isPending}
      />
    </Box>
  );
}
