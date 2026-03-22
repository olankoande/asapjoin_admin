import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, CircularProgress,
  Divider, Card, CardContent, Chip, InputAdornment, Tooltip, IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import TuneIcon from '@mui/icons-material/Tune';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PercentIcon from '@mui/icons-material/Percent';
import { settingsApi } from '../../api/endpoints';
import { getApiError } from '../../api/httpClient';
import toast from 'react-hot-toast';

interface PricingSettings {
  // Trajets
  trip_base_price: number;        // Prix de base ($)
  trip_price_per_km: number;      // Prix par km ($)
  trip_margin_percent: number;    // Marge plateforme (%)
  trip_min_price: number;         // Prix minimum ($)
  trip_max_price_factor: number;  // Facteur prix max (x)
  // Colis
  parcel_base_price: number;      // Prix de base colis ($)
  parcel_price_per_km: number;    // Prix par km colis ($)
  parcel_margin_percent: number;  // Marge colis (%)
  // Commission
  platform_commission_percent: number; // Commission plateforme (%)
}

const DEFAULT_SETTINGS: PricingSettings = {
  trip_base_price: 5.00,
  trip_price_per_km: 0.08,
  trip_margin_percent: 15,
  trip_min_price: 3.00,
  trip_max_price_factor: 1.5,
  parcel_base_price: 5.00,
  parcel_price_per_km: 0.03,
  parcel_margin_percent: 20,
  platform_commission_percent: 15,
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<PricingSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => settingsApi.get().then(r => r.data).catch(() => DEFAULT_SETTINGS),
  });

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => settingsApi.update(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Paramètres sauvegardés');
      setHasChanges(false);
    },
    onError: (e) => toast.error(getApiError(e).message),
  });

  const handleChange = (key: keyof PricingSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setForm(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
  };

  const resetDefaults = () => {
    setForm(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  // Simulation de prix
  const simulatePrice = (distanceKm: number) => {
    const raw = form.trip_base_price + distanceKm * form.trip_price_per_km;
    const withMargin = raw * (1 + form.trip_margin_percent / 100);
    return withMargin.toFixed(2);
  };

  const simulateParcelPrice = (distanceKm: number) => {
    const raw = form.parcel_base_price + distanceKm * form.parcel_price_per_km;
    const withMargin = raw * (1 + form.parcel_margin_percent / 100);
    return withMargin.toFixed(2);
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon /> Paramètres de tarification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configurez les marges et prix de base pour les trajets et colis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RestoreIcon />} onClick={resetDefaults}>
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => saveMut.mutate()}
            disabled={!hasChanges || saveMut.isPending}
          >
            {saveMut.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{getApiError(error).message}</Alert>}
      {hasChanges && <Alert severity="info" sx={{ mb: 2 }}>Vous avez des modifications non sauvegardées</Alert>}

      <Grid container spacing={3}>
        {/* Tarification Trajets */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsCarIcon color="primary" /> Tarification des trajets
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Prix de base"
                type="number"
                value={form.trip_base_price}
                onChange={handleChange('trip_base_price')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: (
                    <Tooltip title="Prix fixe ajouté à chaque trajet">
                      <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  ),
                }}
                inputProps={{ step: 0.5, min: 0 }}
                size="small"
                fullWidth
              />

              <TextField
                label="Prix par kilomètre"
                type="number"
                value={form.trip_price_per_km}
                onChange={handleChange('trip_price_per_km')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/km</InputAdornment>,
                }}
                inputProps={{ step: 0.01, min: 0 }}
                size="small"
                fullWidth
              />

              <TextField
                label="Marge plateforme"
                type="number"
                value={form.trip_margin_percent}
                onChange={handleChange('trip_margin_percent')}
                InputProps={{
                  endAdornment: <InputAdornment position="end"><PercentIcon fontSize="small" /></InputAdornment>,
                }}
                inputProps={{ step: 1, min: 0, max: 100 }}
                size="small"
                fullWidth
              />

              <TextField
                label="Prix minimum par place"
                type="number"
                value={form.trip_min_price}
                onChange={handleChange('trip_min_price')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: 0.5, min: 0 }}
                size="small"
                fullWidth
              />

              <TextField
                label="Facteur prix maximum"
                type="number"
                value={form.trip_max_price_factor}
                onChange={handleChange('trip_max_price_factor')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">×</InputAdornment>,
                }}
                inputProps={{ step: 0.1, min: 1 }}
                size="small"
                fullWidth
                helperText="Le prix max suggéré = prix de base × ce facteur"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Tarification Colis */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalShippingIcon color="secondary" /> Tarification des colis
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Prix de base colis"
                type="number"
                value={form.parcel_base_price}
                onChange={handleChange('parcel_base_price')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: 0.5, min: 0 }}
                size="small"
                fullWidth
              />

              <TextField
                label="Prix par kilomètre (colis)"
                type="number"
                value={form.parcel_price_per_km}
                onChange={handleChange('parcel_price_per_km')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/km</InputAdornment>,
                }}
                inputProps={{ step: 0.01, min: 0 }}
                size="small"
                fullWidth
              />

              <TextField
                label="Marge colis"
                type="number"
                value={form.parcel_margin_percent}
                onChange={handleChange('parcel_margin_percent')}
                InputProps={{
                  endAdornment: <InputAdornment position="end"><PercentIcon fontSize="small" /></InputAdornment>,
                }}
                inputProps={{ step: 1, min: 0, max: 100 }}
                size="small"
                fullWidth
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PercentIcon color="warning" /> Commission plateforme
            </Typography>

            <TextField
              label="Commission sur chaque transaction"
              type="number"
              value={form.platform_commission_percent}
              onChange={handleChange('platform_commission_percent')}
              InputProps={{
                endAdornment: <InputAdornment position="end"><PercentIcon fontSize="small" /></InputAdornment>,
              }}
              inputProps={{ step: 1, min: 0, max: 50 }}
              size="small"
              fullWidth
              helperText="Pourcentage prélevé sur chaque paiement"
            />
          </Paper>
        </Grid>

        {/* Simulation */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>📊 Simulation de prix</Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {[50, 100, 200, 500, 1000].map(km => (
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={km}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">{km} km</Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
                        {simulatePrice(km)} $
                      </Typography>
                      <Chip label="par place" size="small" sx={{ mt: 0.5 }} />
                      <Typography variant="body2" color="secondary" sx={{ mt: 1 }}>
                        {simulateParcelPrice(km)} $
                      </Typography>
                      <Chip label="par colis" size="small" color="secondary" sx={{ mt: 0.5 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
