import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Block as BlockIcon, CheckCircle as UnbanIcon, Edit as EditIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/endpoints';
import type { CreateUserInput, UpdateUserInput } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import type { User } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusChip from '../../components/StatusChip';
import { formatDate } from '../../utils/format';

const ROLES = ['user', 'support', 'admin'];

const emptyCreateForm: CreateUserInput = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  role: 'admin',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'ban' | 'unban' } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserInput>({ ...emptyCreateForm });
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserInput & { password?: string }>({});

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => usersApi.list(search ? { search } : undefined).then((response) => response.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateUserInput) => usersApi.create(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Utilisateur cree avec succes');
      setCreateOpen(false);
      setCreateForm({ ...emptyCreateForm });
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserInput }) => usersApi.update(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Utilisateur mis a jour');
      setEditOpen(false);
      setEditUser(null);
    },
    onError: (mutationError) => toast.error(getApiError(mutationError).message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { is_banned?: boolean } }) => usersApi.updateStatus(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Statut mis a jour');
      setConfirmAction(null);
    },
    onError: (mutationError) => {
      toast.error(getApiError(mutationError).message);
      setConfirmAction(null);
    },
  });

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number || '',
      payout_email: user.payout_email || '',
      role: user.role,
      is_banned: user.is_banned,
      password: '',
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    if (!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleUpdate = () => {
    if (!editUser) return;
    const body: UpdateUserInput = { ...editForm };
    if (!body.password) delete body.password;
    updateMutation.mutate({ id: editUser.id, body });
  };

  const handleBanAction = () => {
    if (!confirmAction) return;
    statusMutation.mutate({
      id: confirmAction.user.id,
      body: { is_banned: confirmAction.action === 'ban' },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Utilisateurs</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} disabled={!can('users.create')}>
          Ajouter un utilisateur
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField size="small" placeholder="Rechercher par email, nom..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ minWidth: 300 }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{getApiError(error).message}</Alert>}

      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Auth</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Telephone</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Cree le</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{user.id}</TableCell>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={user.auth_provider === 'google' ? 'Google' : 'Local'} size="small" variant="outlined" />
                      {user.google_sub ? <Chip label="Lie a Google" size="small" color="info" variant="outlined" /> : null}
                      {user.email_verified ? <Chip label="Email verifie" size="small" color="success" variant="outlined" /> : null}
                    </Box>
                  </TableCell>
                  <TableCell><StatusChip status={user.role} /></TableCell>
                  <TableCell>{user.phone_number || '-'}</TableCell>
                  <TableCell>{user.is_banned ? <Chip label="Banni" color="error" size="small" /> : <Chip label="Actif" color="success" size="small" />}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Modifier">
                      <span>
                        <IconButton size="small" onClick={() => openEdit(user)} disabled={!can('users.update')}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Button size="small" onClick={() => navigate(`/users/${user.id}/roles`)} disabled={!can('users.update')}>
                      Roles
                    </Button>
                    {user.is_banned ? (
                      <Tooltip title="Debannir">
                        <span>
                          <IconButton size="small" color="success" onClick={() => setConfirmAction({ user, action: 'unban' })} disabled={!can('users.ban')}>
                            <UnbanIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Bannir">
                        <span>
                          <IconButton size="small" color="error" onClick={() => setConfirmAction({ user, action: 'ban' })} disabled={!can('users.ban')}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">Aucun utilisateur trouve</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un utilisateur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Prenom *" value={createForm.first_name} onChange={(event) => setCreateForm({ ...createForm, first_name: event.target.value })} fullWidth />
            <TextField label="Nom *" value={createForm.last_name} onChange={(event) => setCreateForm({ ...createForm, last_name: event.target.value })} fullWidth />
            <TextField label="Email *" type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} fullWidth />
            <TextField label="Mot de passe *" type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} fullWidth helperText="Minimum 8 caracteres" />
            <TextField label="Telephone" value={createForm.phone_number} onChange={(event) => setCreateForm({ ...createForm, phone_number: event.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={createForm.role} label="Role" onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createMutation.isPending || !can('users.create')}>
            {createMutation.isPending ? 'Creation...' : 'Creer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'utilisateur {editUser?.email}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Prenom" value={editForm.first_name || ''} onChange={(event) => setEditForm({ ...editForm, first_name: event.target.value })} fullWidth />
            <TextField label="Nom" value={editForm.last_name || ''} onChange={(event) => setEditForm({ ...editForm, last_name: event.target.value })} fullWidth />
            <TextField label="Email" type="email" value={editForm.email || ''} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} fullWidth />
            <TextField label="Telephone" value={editForm.phone_number || ''} onChange={(event) => setEditForm({ ...editForm, phone_number: event.target.value })} fullWidth />
            <TextField label="Email de paiement" value={editForm.payout_email || ''} onChange={(event) => setEditForm({ ...editForm, payout_email: event.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={editForm.role || 'user'} label="Role" onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Bio" value={editForm.bio || ''} onChange={(event) => setEditForm({ ...editForm, bio: event.target.value })} fullWidth multiline rows={3} />
            <TextField label="Nouveau mot de passe" type="password" value={editForm.password || ''} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} fullWidth helperText="Laisser vide pour ne pas changer" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={updateMutation.isPending || !can('users.update')}>
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === 'ban' ? 'Bannir utilisateur' : 'Debannir utilisateur'}
        message={`Etes-vous sur de vouloir ${confirmAction?.action === 'ban' ? 'bannir' : 'debannir'} ${confirmAction?.user.email} ?`}
        onConfirm={handleBanAction}
        onCancel={() => setConfirmAction(null)}
        loading={statusMutation.isPending}
      />
    </Box>
  );
}
