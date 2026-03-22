import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from './AuthProvider';
import { getApiError } from '../api/httpClient';

export default function LoginPage() {
  const { login, user, isReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isReady && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const apiErr = getApiError(err);
      setError(apiErr.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" mb={3} textAlign="center">AsapJoin Admin</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
          <TextField fullWidth label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
          <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 2 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
