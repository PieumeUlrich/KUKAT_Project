import React, { useState, useCallback } from 'react';
import {
  Box, Button, TextField, MenuItem, Card, CardContent,
  CardActions, Typography, Drawer, IconButton, InputAdornment,
  Alert, Chip, Avatar,
} from '@mui/material';
import { Add, Search, Refresh, Close, CardTravel, Edit } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import { usePackages, useCategories } from '../../hooks/useModules';
import { packagesApi } from '../../api/index';
import PackageForm from './PackageForm';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

const CATEGORY_COLORS = {
  'Airlines':         '#E0F2FE',
  'Cruise Lines':     '#CCFBF1',
  'Hotels & Resorts': '#FEF9C3',
  'Tour Operators':   '#F3E8FF',
  'Car Rentals':      '#FFEDD5',
  'Travel Insurance': '#DCFCE7',
};

export default function PackagesPage() {
  const { user } = useAuth();
  const canEdit  = ['superadmin', 'manager'].includes(user?.role);

  const [search,     setSearch]     = useState('');
  const [categoryID, setCategoryID] = useState(''); // ← use ID not name
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  // ← categoryID passed to hook so API filtering works correctly
  const { packages, loading, error, refetch } = usePackages({ search, categoryID });
  const { categories } = useCategories(); // ← dedicated hook for categories list
  const safePackages = packages ?? [];

  const handleSave = useCallback(async (data) => {
    setSaving(true); setSaveError('');
    try {
      if (selected?.productID) await packagesApi.update(selected.productID, data);
      else                     await packagesApi.create(data);
      setDrawerOpen(false); setSelected(null); refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  }, [selected, refetch]);

  const openCreate = () => { setSelected(null); setSaveError(''); setDrawerOpen(true); };
  const openEdit   = (pkg) => { setSelected(pkg); setSaveError(''); setDrawerOpen(true); };

  return (
    <AppLayout title="Travel packages"
      subtitle={`${safePackages.length} product${safePackages.length !== 1 ? 's' : ''}`}>

      {/* ── Search + filters ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto auto' },
        gap: 1.5, alignItems: 'center', mb: 2.5,
      }}>
        <TextField placeholder="Search packages…" size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
            </InputAdornment>
          )}}
        />
        {/* ← Filter by categoryID so the API receives the correct param */}
        <TextField select size="small" label="Category" value={categoryID}
          onChange={(e) => setCategoryID(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All categories</MenuItem>
          {(categories ?? []).map(c => (
            <MenuItem key={c.categoryID} value={c.categoryID}>{c.categoryName}</MenuItem>
          ))}
        </TextField>
        <IconButton onClick={refetch} size="small" sx={{ color: KUKAT.textMuted }}>
          <Refresh />
        </IconButton>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            New package
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Package cards ─────────────────────────────────────── */}
      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr', sm: '1fr 1fr',
            md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} sx={{ height: 180 }} />
          ))}
        </Box>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr', sm: '1fr 1fr',
              md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}>
            {safePackages.map(pkg => {
              const bgColor = CATEGORY_COLORS[pkg.categoryName] || '#F1F5F9';
              return (
                <Card key={pkg.productID} sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 },
                }}>
                  <Box sx={{
                    background: bgColor, p: 2,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}>
                    <Avatar sx={{
                      width: 38, height: 38,
                      background: 'rgba(0,0,0,0.08)', color: KUKAT.navy,
                    }}>
                      <CardTravel sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" fontWeight={700} sx={{
                        color: KUKAT.navy, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {pkg.productName}
                      </Typography>
                      <Chip label={pkg.categoryName || '—'} size="small"
                        sx={{ fontSize: '0.68rem', height: 18,
                          background: 'rgba(0,0,0,0.08)', color: KUKAT.navy, mt: 0.3 }} />
                    </Box>
                  </Box>

                  <CardContent sx={{ flex: 1, pt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                      Supplier
                    </Typography>
                    <Typography variant="body2" fontWeight={500}
                      sx={{ color: KUKAT.navy, mb: 0.5 }}>
                      {pkg.supplierName || '—'}
                    </Typography>

                    {/* Show commission rate on card */}
                    {pkg.supplierCommissionRate != null && (
                      <Typography variant="caption"
                        sx={{ color: '#15803D', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Commission: {parseFloat(pkg.supplierCommissionRate).toFixed(1)}%
                      </Typography>
                    )}

                    <Typography variant="caption" sx={{
                      color: KUKAT.textMuted,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {pkg.description || 'No description available.'}
                    </Typography>

                    <Chip label={pkg.isActive ? 'Active' : 'Inactive'} size="small"
                      sx={{ mt: 1.5, fontSize: '0.68rem', height: 18,
                        background: pkg.isActive ? '#DCFCE7' : '#FEE2E2',
                        color:      pkg.isActive ? '#15803D' : '#DC2626' }} />
                  </CardContent>

                  {canEdit && (
                    <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                      <Button size="small"
                        startIcon={<Edit sx={{ fontSize: '14px !important' }} />}
                        onClick={() => openEdit(pkg)}>
                        Edit
                      </Button>
                    </CardActions>
                  )}
                </Card>
              );
            })}
          </Box>

          {safePackages.length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CardTravel sx={{ fontSize: 48, color: KUKAT.border, mb: 1 }} />
              <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                No packages found.
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* ── Drawer ────────────────────────────────────────────── */}
      <Drawer anchor="right" open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Typography variant="h5" sx={{ color: KUKAT.navy }}>
            {selected ? 'Edit package' : 'New package'}
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} disabled={saving}>
            <Close />
          </IconButton>
        </Box>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>
            {saveError}
          </Alert>
        )}
        <PackageForm
          initial={selected}
          onSave={handleSave}
          onCancel={() => setDrawerOpen(false)}
          saving={saving}
        />
      </Drawer>

    </AppLayout>
  );
}