import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  MenuItem, InputAdornment, Alert, Drawer, IconButton,
  Avatar, Chip, Switch, FormControlLabel, Divider, CircularProgress,
} from '@mui/material';
import { Add, Search, Refresh, Close, ManageAccounts, SupportAgent, CheckCircle } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import { useStaff, useStaffStats } from '../../hooks/useModules';
import { staffApi } from '../../api/index';
import { KUKAT } from '../../styles/theme';

const ROLE_COLORS = {
  superadmin: { bg: '#0B2B40', color: '#FCD34D' },
  manager:    { bg: '#7E22CE', color: '#F3E8FF' },
  agent:      { bg: '#15803D', color: '#DCFCE7' },
  accountant: { bg: '#854D0E', color: '#FEF9C3' },
  hr:         { bg: '#9F1239', color: '#FFE4E6' },
};

const COLUMNS = [
  { id: 'employeeID', label: 'ID',        minWidth: 60 },
  { id: 'name',       label: 'Employee',  minWidth: 200,
    render: (_, r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700,
          background: KUKAT.navy, color: '#fff' }}>
          {r.firstName?.[0]}{r.lastName?.[0]}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>{r.firstName} {r.lastName}</Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{r.email}</Typography>
        </Box>
      </Box>
    )},
  { id: 'agentCode',  label: 'Code',      minWidth: 80 },
  { id: 'roleName',   label: 'Role',      minWidth: 120, sortable: false,
    render: (v) => {
      const cfg = ROLE_COLORS[v] || { bg: '#F1F5F9', color: '#475569' };
      return (
        <Chip label={v} size="small" sx={{ fontSize: '0.72rem', height: 22, borderRadius: '6px',
          backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600,
          '& .MuiChip-label': { px: 1.2 }, textTransform: 'capitalize' }} />
      );
    }},
  { id: 'phoneNumber', label: 'Phone',    minWidth: 130 },
  { id: 'city',        label: 'City',     minWidth: 110 },
  { id: 'isActive',    label: 'Status',   minWidth: 90, sortable: false,
    render: (v) => (
      <Chip label={v ? 'Active' : 'Inactive'} size="small"
        sx={{ fontSize: '0.72rem', height: 22, borderRadius: '6px',
          background: v ? '#DCFCE7' : '#FEE2E2', color: v ? '#15803D' : '#DC2626',
          fontWeight: 600, '& .MuiChip-label': { px: 1.2 } }} />
    )},
];

const toDateInput = (val) => {
  if (!val) return '';
  try { return new Date(val).toISOString().slice(0, 10); }
  catch { return ''; }
};

// ── Staff Form ─────────────────────────────────────────────────
const StaffForm = ({ initial = {}, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', agentCode: '', phoneNumber: '',
    city: '', province: '', postalCode: '', country: 'Canada',
    roleID: '', isActive: true, password: '',
    ...initial,
    hireDate: toDateInput(initial?.hireDate),
    address1: initial?.address1 || '',
  });
  const [roles,  setRoles]  = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    staffApi.getRoles()
      .then(({ data }) => setRoles(Array.isArray(data) ? data : (data.roles ?? [])))
      .catch(() => {});
  }, []);

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const isEdit = !!initial?.employeeID;

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    if (!form.roleID)           e.roleID    = 'Required';
    if (!isEdit && !form.password) e.password = 'Required for new employees';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="First name *" value={form.firstName} onChange={set('firstName')}
          error={!!errors.firstName} helperText={errors.firstName} />
        <TextField fullWidth label="Last name *" value={form.lastName} onChange={set('lastName')}
          error={!!errors.lastName} helperText={errors.lastName} />
      </Box>

      <TextField fullWidth label="Email *" type="email" value={form.email} onChange={set('email')}
        error={!!errors.email} helperText={errors.email} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Agent code" value={form.agentCode} onChange={set('agentCode')} />
        <TextField fullWidth label="Phone" value={form.phoneNumber} onChange={set('phoneNumber')} />
      </Box>

      <TextField select fullWidth label="Role *" value={form.roleID} onChange={set('roleID')}
        error={!!errors.roleID} helperText={errors.roleID}>
        {roles.map(r => (
          <MenuItem key={r.roleID} value={r.roleID} sx={{ textTransform: 'capitalize' }}>
            {r.roleName}
          </MenuItem>
        ))}
      </TextField>

      {!isEdit && (
        <TextField fullWidth label="Password *" type="password"
          value={form.password} onChange={set('password')}
          error={!!errors.password}
          helperText={errors.password || 'Temporary password for first login'} />
      )}

      <TextField fullWidth label="Hire date" type="date"
        value={form.hireDate} onChange={set('hireDate')}
        InputLabelProps={{ shrink: true }} />

      <Divider><Typography variant="caption">Address</Typography></Divider>

      <TextField fullWidth label="Address" value={form.address1} onChange={set('address1')} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="City"        value={form.city}       onChange={set('city')} />
        <TextField fullWidth label="Province"    value={form.province}   onChange={set('province')} />
        <TextField fullWidth label="Postal code" value={form.postalCode} onChange={set('postalCode')} />
        <TextField fullWidth label="Country"     value={form.country}    onChange={set('country')} />
      </Box>

      {isEdit && (
        <FormControlLabel
          control={
            <Switch checked={!!form.isActive}
              onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
          }
          label="Employee is active"
        />
      )}

      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 1, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving}
          onClick={() => { if (validate()) onSave(form); }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : isEdit ? 'Save changes' : 'Create employee'}
        </Button>
      </Box>

    </Box>
  );
};

// ── Staff Page ─────────────────────────────────────────────────
export default function StaffPage() {
  const [search,     setSearch]     = useState('');
  const [role,       setRole]       = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const { staff,   loading,      error,   refetch } = useStaff({ search, role });
  const { stats: globalStats, loading: statsLoading } = useStaffStats();
  const safeStaff = staff ?? [];

  const totals = {
    total:  globalStats?.total  ?? safeStaff.length,
    active: globalStats?.active ?? safeStaff.filter(s => s.isActive).length,
    agents: globalStats?.agents ?? safeStaff.filter(s => s.roleName === 'agent').length,
  };

  const handleSave = useCallback(async (data) => {
    setSaving(true); setSaveError('');
    try {
      if (selected?.employeeID) await staffApi.update(selected.employeeID, data);
      else await staffApi.create(data);
      setDrawerOpen(false); setSelected(null); refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  }, [selected, refetch]);

  return (
    <AppLayout title="Staff management"
      subtitle={`${totals.total} employee${totals.total !== 1 ? 's' : ''}`}>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        {[
          { label: 'Total staff', value: totals.total,  color: KUKAT.navy,  icon: <ManageAccounts sx={{ fontSize: 28, color: KUKAT.navy }} /> },
          { label: 'Active',      value: totals.active, color: '#15803D',   icon: <CheckCircle    sx={{ fontSize: 28, color: '#15803D' }} /> },
          { label: 'Agents',      value: totals.agents, color: KUKAT.teal,  icon: <SupportAgent   sx={{ fontSize: 28, color: KUKAT.teal }} /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent sx={{ p: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '10px',
                  background: `${s.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.icon}
                </Box>
              </Box>
              <Typography sx={{ fontSize: '1.45rem', fontWeight: 700, color: s.color }}>
                {loading || statsLoading ? '…' : s.value}
              </Typography>
              <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Search + filters ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto auto' },
        gap: 1.5,
        alignItems: 'center',
        mb: 2.5,
      }}>
        <TextField placeholder="Search name, email, code…" size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
            </InputAdornment>
          )}}
        />
        <TextField select size="small" label="Role" value={role}
          onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 150 }}>
          {['', 'superadmin', 'manager', 'agent', 'accountant', 'hr'].map(r => (
            <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
              {r || 'All roles'}
            </MenuItem>
          ))}
        </TextField>
        <IconButton onClick={refetch} size="small" sx={{ color: KUKAT.textMuted }}>
          <Refresh />
        </IconButton>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => { setSelected(null); setSaveError(''); setDrawerOpen(true); }}>
          New employee
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS} rows={safeStaff} loading={loading}
        keyField="employeeID"
        onRowClick={(row) => { setSelected(row); setSaveError(''); setDrawerOpen(true); }}
        emptyMessage="No employees found."
      />

      {/* ── Employee drawer ───────────────────────────────────── */}
      <Drawer anchor="right" open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              {selected ? `${selected.firstName} ${selected.lastName}` : 'New employee'}
            </Typography>
            {selected && (
              <Typography variant="caption"
                sx={{ color: KUKAT.textMuted, textTransform: 'capitalize' }}>
                {selected.roleName} · {selected.agentCode}
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
        <StaffForm
          initial={selected}
          onSave={handleSave}
          onCancel={() => setDrawerOpen(false)}
          saving={saving}
        />
      </Drawer>

    </AppLayout>
  );
}