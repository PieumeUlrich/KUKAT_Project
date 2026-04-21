import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, Card, CardContent, Tooltip,
  Typography, Drawer, IconButton, InputAdornment, Alert, Avatar,
} from '@mui/material';
import { Add, Search, Refresh, Close, People, PersonAdd, SwapHoriz } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import CustomerForm from './CustomerForm';
import { useCustomers, useCustomerStats } from '../../hooks/useModules';
import { customersApi } from '../../api/index';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';
import exportToCsv from '../../utils/exportCsv';
import { Download } from '@mui/icons-material';

const StatCard = ({ label, value, icon, color, loading }) => {
  return (
    <Card><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '11px', background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '1.45rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1 }}>
          {loading ? '…' : value}
        </Typography>
        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{label}</Typography>
      </Box>
    </CardContent></Card>
  );
}

const COLUMNS = [
  { id: 'customerID',   label: 'ID',       minWidth: 60 },
  { id: 'name',         label: 'Name',     minWidth: 160,
    render: (_, r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700,
          background: KUKAT.navy, color: '#fff' }}>
          {r.firstName?.[0]}{r.lastName?.[0]}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>{r.firstName} {r.lastName}</Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{r.email}</Typography>
        </Box>
      </Box>
    )},
  { id: 'city',         label: 'City',     minWidth: 110 },
  { id: 'province',     label: 'Province', minWidth: 90 },
  { id: 'homePhone',    label: 'Phone',    minWidth: 130 },
  { id: 'agentName',    label: 'Agent',    minWidth: 150 },
  { id: 'bookingCount', label: 'Bookings', minWidth: 90, align: 'center' },
];

const CSV_COLUMNS = [
  { id: 'customerID',   label: 'Customer ID' },
  { id: 'firstName',    label: 'First name' },
  { id: 'lastName',     label: 'Last name' },
  { id: 'email',        label: 'Email' },
  { id: 'homePhone',    label: 'Home phone' },
  { id: 'city',         label: 'City' },
  { id: 'province',     label: 'Province' },
  { id: 'country',      label: 'Country' },
  { id: 'agentName',    label: 'Assigned agent' },
];

const CustomersPage = () => {
  const navigate = useNavigate();
  const { isHR, isAdmin, isManager } = useAuth();
  const [search,     setSearch]     = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const { customers: rawCustomers, loading, error, total, refetch } = useCustomers({ search });
  const { stats: globalStats } = useCustomerStats();
  const customers = rawCustomers ?? [];

  const handleCreate = useCallback(async (data) => {
    setSaving(true); setSaveError('');
    try {
      await customersApi.create(data);
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to create customer.');
    } finally { setSaving(false); }
  }, [refetch]);

  return (
    <AppLayout title="Customers" subtitle={`${total} total customer${total !== 1 ? 's' : ''}`}>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <StatCard label="Total customers" value={total}
          icon={<People />} color={KUKAT.teal} loading={loading} />
        <StatCard label="New this month"
          value={globalStats?.newThisMonth ?? 0}
          icon={<PersonAdd />} color={KUKAT.amber} loading={loading} />
        <StatCard label="With active bookings"
          value={globalStats?.withBookings ?? 0}
          icon={<SwapHoriz />} color={KUKAT.navy} loading={loading} />
      </Box>

      {/* ── Search + actions ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr auto', sm: '1fr auto auto' },
        gap: 1.5,
        alignItems: 'center',
        mb: 2.5,
      }}>
        <TextField
          placeholder="Search name, email, city…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
              </InputAdornment>
            ),
          }}
        />
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={refetch} size="small" sx={{ color: KUKAT.textMuted }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton
              onClick={() => exportToCsv('kukat_customers', customers, CSV_COLUMNS)}
              size="small"
              sx={{ color: KUKAT.textMuted }}
              title="Export to CSV"
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => { setSaveError(''); setDrawerOpen(true); }}>
          New customer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS}
        rows={customers}
        loading={loading}
        keyField="customerID"
        onRowClick={(row) => navigate(`/customers/${row.customerID}`)}
        emptyMessage="No customers found."
      />

      {/* ── New customer drawer ──────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflow: 'auto' } }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>New customer</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Add a new customer profile
            </Typography>
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

        <CustomerForm
          onSave={handleCreate}
          onCancel={() => setDrawerOpen(false)}
          saving={saving}
        />
      </Drawer>

    </AppLayout>
  );
};  

export default CustomersPage;