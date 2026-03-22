import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiError } from '../../../api/httpClient';
import { useRole } from '../hooks/useRole';
import { usePermissions } from '../hooks/usePermissions';
import { rolesApi } from '../api/rolesApi';
import RoleForm from '../components/RoleForm';

export default function RoleEditPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { data: role, isLoading: loadingRole, error: roleError } = useRole(id);
  const { data: allPermissions, isLoading: loadingPermissions, error: permissionsError } = usePermissions();
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      rolesApi.getPermissions(role.id).then((response) => {
        setSelectedPermissionIds(response.data.filter((permission) => permission.assigned).map((permission) => permission.id));
      });
    }
  }, [role]);

  const mutation = useMutation({
    mutationFn: async () => {
      await rolesApi.update(id, { name, description });
      await rolesApi.replacePermissions(id, selectedPermissionIds);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rbac-role', id] }),
        queryClient.invalidateQueries({ queryKey: ['rbac-roles'] }),
      ]);
      toast.success('Role mis a jour');
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  if (roleError || permissionsError) {
    return <Alert severity="error">{getApiError(roleError || permissionsError).message}</Alert>;
  }

  if (loadingRole || loadingPermissions || !role) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>Editer le role</Typography>
      <RoleForm
        mode="edit"
        name={name}
        code={role.code}
        description={description}
        permissions={allPermissions ?? []}
        selectedPermissionIds={selectedPermissionIds}
        isSystem={role.is_system}
        onNameChange={setName}
        onCodeChange={() => {}}
        onDescriptionChange={setDescription}
        onPermissionsChange={setSelectedPermissionIds}
        onSubmit={() => mutation.mutate()}
        loading={mutation.isPending}
      />
    </Box>
  );
}
