import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiError } from '../../../api/httpClient';
import { usePermissions } from '../hooks/usePermissions';
import { rolesApi } from '../api/rolesApi';
import RoleForm from '../components/RoleForm';

export default function RoleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: permissions, isLoading, error } = usePermissions();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    setCode((currentCode) => currentCode || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'));
  }, [name]);

  const mutation = useMutation({
    mutationFn: async () => {
      const role = await rolesApi.create({ name, code, description }).then((response) => response.data);
      await rolesApi.replacePermissions(role.id, selectedPermissionIds);
      return role;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      toast.success('Role cree');
      navigate(`/roles/${role.id}`);
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>Creer un role</Typography>
      {error && <Alert severity="error">{getApiError(error).message}</Alert>}
      {isLoading ? <CircularProgress /> : (
        <RoleForm
          mode="create"
          name={name}
          code={code}
          description={description}
          permissions={permissions ?? []}
          selectedPermissionIds={selectedPermissionIds}
          onNameChange={setName}
          onCodeChange={setCode}
          onDescriptionChange={setDescription}
          onPermissionsChange={setSelectedPermissionIds}
          onSubmit={() => mutation.mutate()}
          loading={mutation.isPending}
        />
      )}
    </Box>
  );
}
