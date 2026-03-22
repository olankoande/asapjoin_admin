import { Box, Checkbox, FormControlLabel, FormGroup, Paper, Stack, Typography } from '@mui/material';
import type { Permission } from '../../../api/types';

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onChange: (nextIds: string[]) => void;
  disabled?: boolean;
}

export default function PermissionMatrix({ permissions, selectedPermissionIds, onChange, disabled = false }: PermissionMatrixProps) {
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    acc[permission.module] = acc[permission.module] || [];
    acc[permission.module].push(permission);
    return acc;
  }, {});

  const toggle = (permissionId: string) => {
    if (selectedPermissionIds.includes(permissionId)) {
      onChange(selectedPermissionIds.filter((id) => id !== permissionId));
      return;
    }
    onChange([...selectedPermissionIds, permissionId]);
  };

  return (
    <Stack spacing={2}>
      {Object.entries(grouped).map(([module, modulePermissions]) => (
        <Paper key={module} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} textTransform="capitalize" mb={1}>
            {module}
          </Typography>
          <FormGroup>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
              {modulePermissions.map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={selectedPermissionIds.includes(permission.id)}
                      onChange={() => toggle(permission.id)}
                      disabled={disabled}
                    />
                  }
                  label={`${permission.action} (${permission.code})`}
                />
              ))}
            </Box>
          </FormGroup>
        </Paper>
      ))}
    </Stack>
  );
}
