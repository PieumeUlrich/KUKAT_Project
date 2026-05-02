import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, MenuItem, Card, CardContent,
  Typography, Drawer, IconButton, InputAdornment, Alert,
  Chip, Avatar, Divider, Switch, FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add, Search, Refresh, Close, Business,
  AccountBalance, Warning, CheckCircle,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import { useSuppliers, useSupplierStats } from '../../hooks/useModules';
import { suppliersApi } from '../../api/index';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color, loading, prefix = '' }) {
  return (
    <Card>
      <CardContent sx={{
        display: 'flex', alignItems: 'center',
        gap: 2, p: '16px !important',
      }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '11px',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{
            fontSize: '1.35rem', fontWeight: 700,
            color: KUKAT.navy, lineHeight: 1,
          }}>
            {loading ? '…' : `${prefix}${value}`}
          </Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Supplier form ─────────────────────────────────────────────
function SupplierForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
  supplierName:    '',
  contactName:     '',
  representative:  '',
  email:           '',
  phoneNumber:     '',
  fax:             '',
  website:         '',
  address1:        '',
  address2:        '',
  city:            '',
  province:        '',
  postalCode:      '',
  country:         '',
  commissionRate:  '10',
  affiliationCode: '',
  notes:           '',
  isActive:        true,
  ...initial,
  // eslint-disable-next-line
  commissionRate: String(initial?.commissionRate ?? '10'),
});
  const [errors, setErrors] = useState({});

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.supplierName.trim()) e.supplierName = 'Required';
    const rate = parseFloat(form.commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100)
      e.commissionRate = 'Must be between 0 and 100';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isEdit = !!initial?.supplierID;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <TextField fullWidth label="Supplier name *" value={form.supplierName}
        onChange={set('supplierName')}
        error={!!errors.supplierName} helperText={errors.supplierName} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Contact name" value={form.contactName}
          onChange={set('contactName')} />
        <TextField fullWidth label="Email" type="email" value={form.email}
          onChange={set('email')} />
        <TextField fullWidth label="Phone" value={form.phone}
          onChange={set('phone')} />
        <TextField fullWidth label="Commission rate (%)" type="number"
          value={form.commissionRate} onChange={set('commissionRate')}
          error={!!errors.commissionRate}
          helperText={errors.commissionRate || 'e.g. 10 = 10%'}
          inputProps={{ min: 0, max: 100, step: 0.1 }} />
      </Box>

      <Divider><Typography variant="caption">Address</Typography></Divider>

      <TextField fullWidth label="Street address" value={form.address}
        onChange={set('address')} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="City"    value={form.city}    onChange={set('city')} />
        <TextField fullWidth label="Country" value={form.country} onChange={set('country')} />
      </Box>

      <TextField fullWidth label="Affiliation code"
        value={form.affiliationCode} onChange={set('affiliationCode')}
        helperText="e.g. IATA, TICO, ACTA" />

      <TextField fullWidth label="Notes" multiline rows={2}
        value={form.notes} onChange={set('notes')} />

      {isEdit && (
        <FormControlLabel
          control={
            <Switch checked={!!form.isActive}
              onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
          }
          label="Supplier is active"
        />
      )}

      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 1, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" disabled={saving}
          onClick={() => { if (validate()) onSave(form); }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : isEdit ? 'Save changes' : 'Create supplier'}
        </Button>
      </Box>
    </Box>
  );
}

// ── Columns ───────────────────────────────────────────────────
const COLUMNS = [
  { id: 'supplierID',   label: 'ID',          minWidth: 70 },
  { id: 'supplierName', label: 'Supplier',     minWidth: 200,
    render: (_, r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 32, height: 32, fontSize: '0.78rem', fontWeight: 700,
          background: `${KUKAT.navy}15`, color: KUKAT.navy,
        }}>
          {r.supplierName?.slice(0, 2).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {r.supplierName}
          </Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
            {[r.city, r.country].filter(Boolean).join(', ') || r.contactName || '—'}
          </Typography>
        </Box>
      </Box>
    )},
  { id: 'contactName',        label: 'Contact',     minWidth: 140 },
  { id: 'commissionRate',     label: 'Commission',  minWidth: 110, align: 'right',
    render: (v) => (
      <Chip label={`${parseFloat(v || 0).toFixed(1)}%`} size="small"
        sx={{ background: '#DCFCE7', color: '#15803D', fontWeight: 700,
          fontSize: '0.75rem' }} />
    )},
  { id: 'productCount',       label: 'Products',    minWidth: 90, align: 'center' },
  { id: 'pendingCommissions', label: 'Pending ($)', minWidth: 140, align: 'right',
    render: (v) => v > 0 ? (
      <Typography variant="body2" fontWeight={700} sx={{ color: KUKAT.amber }}>
        ${parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
      </Typography>
    ) : (
      <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>—</Typography>
    )},
  { id: 'overdueCount', label: '', minWidth: 40, sortable: false,
    render: (v) => v > 0 ? (
      <Chip label="OVERDUE" size="small"
        sx={{ background: '#FEE2E2', color: '#DC2626', fontSize: '0.65rem' }} />
    ) : null },
  { id: 'isActive', label: 'Status', minWidth: 90, sortable: false,
    render: (v) => (
      <Chip label={v ? 'Active' : 'Inactive'} size="small"
        sx={{ fontSize: '0.72rem', height: 22, borderRadius: '6px',
          background: v ? '#DCFCE7' : '#FEE2E2',
          color:      v ? '#15803D' : '#DC2626', fontWeight: 600 }} />
    )},
];

// ── Page ──────────────────────────────────────────────────────
export default function SuppliersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit  = ['superadmin', 'manager'].includes(user?.role);

  const [search,     setSearch]     = useState('');
  const [isActive,   setIsActive]   = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const { suppliers, loading, error, total, refetch } =
    useSuppliers({ search, isActive: isActive || undefined });
  const { stats, loading: statsLoading } = useSupplierStats();

  const handleSave = useCallback(async (data) => {
    setSaving(true); setSaveError('');
    try {
      if (selected?.supplierID) await suppliersApi.update(selected.supplierID, data);
      else                      await suppliersApi.create(data);
      setDrawerOpen(false); setSelected(null); refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save supplier.');
    } finally { setSaving(false); }
  }, [selected, refetch]);

  return (
    <AppLayout title="Suppliers"
      subtitle={`${total} supplier${total !== 1 ? 's' : ''}`}>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2, mb: 3,
      }}>
        <StatCard label="Total suppliers"        value={stats?.total ?? 0}
          icon={<Business />}       color={KUKAT.navy}  loading={statsLoading} />
        <StatCard label="Active"                 value={stats?.active ?? 0}
          icon={<CheckCircle />}    color={KUKAT.teal}  loading={statsLoading} />
        <StatCard label="Commissions pending"
          value={(stats?.totalPendingAmount ?? 0)
            .toLocaleString('en-CA', { minimumFractionDigits: 2 })}
          icon={<AccountBalance />} color={KUKAT.amber} loading={statsLoading} prefix="$" />
        <StatCard label="Overdue from suppliers" value={stats?.withOverdueCommissions ?? 0}
          icon={<Warning />}        color="#DC2626"      loading={statsLoading} />
      </Box>

      {/* ── Search + filters ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto auto' },
        gap: 1.5, alignItems: 'center', mb: 2.5,
      }}>
        <TextField placeholder="Search supplier, city, contact…"
          size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
            </InputAdornment>
          )}}
        />
        <TextField select size="small" label="Status" value={isActive}
          onChange={(e) => setIsActive(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
        <IconButton onClick={refetch} size="small" sx={{ color: KUKAT.textMuted }}>
          <Refresh />
        </IconButton>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setSelected(null); setSaveError(''); setDrawerOpen(true); }}>
            New supplier
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS} rows={suppliers} loading={loading}
        keyField="supplierID"
        onRowClick={(row) => navigate(`/suppliers/${row.supplierID}`)}
        emptyMessage="No suppliers found."
      />

      {/* ── Create / edit drawer ──────────────────────────────── */}
      <Drawer anchor="right" open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              {selected ? selected.supplierName : 'New supplier'}
            </Typography>
            {selected && (
              <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                {[selected.city, selected.country].filter(Boolean).join(', ')
                  || `Supplier #${selected.supplierID}`}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} disabled={saving}>
            <Close />
          </IconButton>
        </Box>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>
            {saveError}
          </Alert>
        )}
        <SupplierForm
          initial={selected}
          onSave={handleSave}
          onCancel={() => setDrawerOpen(false)}
          saving={saving}
        />
      </Drawer>

    </AppLayout>
  );
}