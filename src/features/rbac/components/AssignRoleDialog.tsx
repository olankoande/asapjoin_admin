import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import type { Role } from '../../../api/types';
import PermissionMatrix from './PermissionMatrix';

interface AssignRoleDialogProps {
  open: boolean;
  roles: Role[];
  selectedRoleIds: string[];
  loading?: boolean;
  onClose: () => void;
  onChange: (roleIds: string[]) => void;
  onConfirm: () => void;
}

export default function AssignRoleDialog({ open, roles, selectedRoleIds, loading = false, onClose, onChange, onConfirm }: AssignRoleDialogProps) {
  const pseudoPermissions = roles.map((role) => ({
    id: role.id,
    module: role.is_system ? 'system' : 'custom',
    action: role.name,
    code: role.code,
    description: role.description,
  }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Assigner des roles</DialogTitle>
      <DialogContent>
        <PermissionMatrix permissions={pseudoPermissions} selectedPermissionIds={selectedRoleIds} onChange={onChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={onConfirm} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
