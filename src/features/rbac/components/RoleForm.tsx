import { Box, Button, Paper, TextField } from '@mui/material';
import type { Permission } from '../../../api/types';
import PermissionMatrix from './PermissionMatrix';

interface RoleFormProps {
  mode: 'create' | 'edit';
  name: string;
  code: string;
  description: string;
  permissions: Permission[];
  selectedPermissionIds: string[];
  isSystem?: boolean;
  loading?: boolean;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPermissionsChange: (ids: string[]) => void;
  onSubmit: () => void;
}

export default function RoleForm({
  mode,
  name,
  code,
  description,
  permissions,
  selectedPermissionIds,
  isSystem = false,
  loading = false,
  onNameChange,
  onCodeChange,
  onDescriptionChange,
  onPermissionsChange,
  onSubmit,
}: RoleFormProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper sx={{ p: 3, display: 'grid', gap: 2 }}>
        <TextField label="Nom" value={name} onChange={(event) => onNameChange(event.target.value)} required />
        <TextField label="Code" value={code} onChange={(event) => onCodeChange(event.target.value)} disabled={mode === 'edit' || isSystem} required />
        <TextField label="Description" value={description} onChange={(event) => onDescriptionChange(event.target.value)} multiline rows={3} />
      </Paper>

      <PermissionMatrix
        permissions={permissions}
        selectedPermissionIds={selectedPermissionIds}
        onChange={onPermissionsChange}
        disabled={isSystem}
      />

      <Box>
        <Button variant="contained" onClick={onSubmit} disabled={loading || !name.trim() || !code.trim()}>
          {loading ? 'Enregistrement...' : mode === 'create' ? 'Creer le role' : 'Enregistrer'}
        </Button>
      </Box>
    </Box>
  );
}
