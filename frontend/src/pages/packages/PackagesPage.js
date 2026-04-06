import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, MenuItem, Grid, Card, CardContent,
  CardActions, Typography, Drawer, IconButton, InputAdornment,
  Alert, Chip, Avatar,
} from '@mui/material';
import { Add, Search, Refresh, Close, CardTravel, Edit } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import { usePackages } from '../../hooks/useModules';
import { packagesApi } from '../../api/allModulesApi';
import PackageForm from './PackageForm';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

const CATEGORY_COLORS = {
  'Airlines': '#E0F2FE',  'Cruise Lines': '#CCFBF1',
  'Hotels & Resorts': '#FEF9C3', 'Tour Operators': '#F3E8FF',
  'Car Rentals': '#FFEDD5', 'Travel Insurance': '#DCFCE7',
};

export default function PackagesPage() {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const { packages, loading, error, refetch } = usePackages({ search, category });
  const safePackages = packages ?? [];

  const categories = [...new Set(packages.map(p => p.categoryName).filter(Boolean))];

  const handleSave = useCallback(async (data) => {
    setSaving(true); setSaveError('');
    try {
      if (selected?.productID) await packagesApi.update(selected.productID, data);
      else await packagesApi.create(data);
      setDrawerOpen(false); setSelected(null); refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  }, [selected, refetch]);

  const openCreate = () => { setSelected(null); setSaveError(''); setDrawerOpen(true); };
  const openEdit   = (pkg) => { setSelected(pkg); setSaveError(''); setDrawerOpen(true); };

  return (
    <AppLayout title="Travel packages" subtitle={`${safePackages.length} product${safePackages.length !== 1 ? 's' : ''}`}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField placeholder="Search packages…" size="small" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start">
            <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} /></InputAdornment> }} />
        <TextField select size="small" label="Category" value={category}
          onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <IconButton onClick={refetch} size="small" sx={{ color: KUKAT.textMuted }}><Refresh /></IconButton>
        {(isAdmin() || isManager()) && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New package</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card sx={{ height: 180 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {packages.map(pkg => {
            const bgColor = CATEGORY_COLORS[pkg.categoryName] || '#F1F5F9';
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={pkg.productID}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
                  <Box sx={{ background: bgColor, p: 2, display: 'flex',
                    alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 38, height: 38, background: 'rgba(0,0,0,0.08)',
                      color: KUKAT.navy }}>
                      <CardTravel sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: KUKAT.navy,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pkg.productName}
                      </Typography>
                      <Chip label={pkg.categoryName || '—'} size="small"
                        sx={{ fontSize: '0.68rem', height: 18, background: 'rgba(0,0,0,0.08)',
                          color: KUKAT.navy, mt: 0.3 }} />
                    </Box>
                  </Box>
                  <CardContent sx={{ flex: 1, pt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                      Supplier
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ color: KUKAT.navy, mb: 1 }}>
                      {pkg.supplierName || '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: KUKAT.textMuted, display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {pkg.description || 'No description available.'}
                    </Typography>
                    <Chip label={pkg.isActive ? 'Active' : 'Inactive'} size="small"
                      sx={{ mt: 1.5, fontSize: '0.68rem', height: 18,
                        background: pkg.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: pkg.isActive ? '#15803D' : '#DC2626' }} />
                  </CardContent>
                  {(isAdmin() || isManager()) && (
                    <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                      <Button size="small" startIcon={<Edit sx={{ fontSize: '14px !important' }} />}
                        onClick={() => openEdit(pkg)}>
                        Edit
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
          {packages.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CardTravel sx={{ fontSize: 48, color: KUKAT.border, mb: 1 }} />
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No packages found.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      <Drawer anchor="right" open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              {selected ? 'Edit package' : 'New package'}
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} disabled={saving}><Close /></IconButton>
        </Box>
        {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>{saveError}</Alert>}
        <PackageForm initial={selected} onSave={handleSave} onCancel={() => setDrawerOpen(false)} saving={saving} />
      </Drawer>
    </AppLayout>
  );
}
