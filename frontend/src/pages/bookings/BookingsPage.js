import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, TextField, MenuItem,
  Grid, Card, CardContent, Drawer, IconButton,
  InputAdornment, Tooltip, Alert,
} from '@mui/material';
import {
  Add, Search, FilterList, Close, Refresh,
  BookOnline, CheckCircle, HourglassEmpty, Cancel,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import BookingForm from './BookingForm';
import { useBookings, useBookingStats } from '../../hooks/useBookings';
import { bookingsApi } from '../../api/index';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KUKAT } from '../../styles/theme';

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, loading }) => {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '11px', flexShrink: 0,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.45rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1 }}>
            {loading ? '…' : value}
          </Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Column definitions ────────────────────────────────────────
const COLUMNS = [
  { id: 'bookingID',   label: 'ID',          minWidth: 60 },
  { id: 'customerName', label: 'Customer',   minWidth: 160 },
  { id: 'productName',  label: 'Product',    minWidth: 180 },
  { id: 'destination',  label: 'Destination',minWidth: 130 },
  { id: 'tripStart',    label: 'Trip start', minWidth: 110,
    render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
  { id: 'tripEnd',      label: 'Trip end',   minWidth: 110,
    render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
  { id: 'basePrice',    label: 'Base price', minWidth: 110, align: 'right',
    render: (v) => v != null ? `$${parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : '—' },
  { id: 'status',       label: 'Status',     minWidth: 110, sortable: false,
    render: (v) => <StatusChip status={v} /> },
  { id: 'agentName',    label: 'Agent',      minWidth: 140 },
];

const STATUS_FILTERS = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const filters = { search, status };
  const { bookings, loading, error, total, refetch } = useBookings(filters);
  const { stats: globalStats } = useBookingStats();
  
  const stats = {
    total:     globalStats?.total     ?? 0,
    confirmed: globalStats?.confirmed ?? 0,
    pending:   globalStats?.pending   ?? 0,
    cancelled: globalStats?.cancelled ?? 0,
    completed: globalStats?.completed ?? 0,
  };

  // ── Stats ──────────────────────────────────────────────────
  /*
    This stats are being calculated based on the pagination click of users
    For use in the future
  */
  // const stats = {
  //   total:     bookings.length,
  //   confirmed: bookings.filter((b) => b.status === 'confirmed').length,
  //   pending:   bookings.filter((b) => b.status === 'pending').length,
  //   cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  // };

  // ── Create booking ─────────────────────────────────────────
  const handleCreate = useCallback(async (formData) => {
    setSaving(true);
    setSaveError('');
    try {
      await bookingsApi.create(formData);
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setSaving(false);
    }
  }, [refetch]);

  return (
    <AppLayout
      title="Bookings"
      subtitle={`${total} total booking${total !== 1 ? 's' : ''}`}
    >
      {/* ── Stats bar ──────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
          <StatCard label="Total" value={stats.total}
            icon={<BookOnline />} color={KUKAT.navy} loading={loading} />
          <StatCard label="Confirmed" value={stats.confirmed}
            icon={<CheckCircle />} color="#15803D" loading={loading} />
          <StatCard label="Pending" value={stats.pending}
            icon={<HourglassEmpty />} color={KUKAT.amber} loading={loading} />
          <StatCard label="Completed" value={stats.completed}
            icon={<CheckCircle />} color={KUKAT.teal} loading={loading} />
          <StatCard label="Cancelled" value={stats.cancelled}
            icon={<Cancel />} color="#DC2626" loading={loading} />
      </Box>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <TextField
          placeholder="Search customer, product, ID…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select size="small" label="Status" value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {STATUS_FILTERS.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s || 'All statuses'}
            </MenuItem>
          ))}
        </TextField>

        <Tooltip title="Refresh">
          <IconButton onClick={refetch} size="small" sx={{ color: KUKAT.textMuted }}>
            <Refresh />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setSaveError(''); setDrawerOpen(true); }}
          sx={{ ml: 'auto' }}
        >
          New booking
        </Button>
      </Box>

      {/* ── Error state ─────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Table ───────────────────────────────────────────── */}
      <DataTable
        columns={COLUMNS}
        rows={bookings}
        loading={loading}
        keyField="bookingID"
        onRowClick={(row) => navigate(`/bookings/${row.bookingID}`)}
        emptyMessage="No bookings found. Create one to get started."
      />

      {/* ── Create drawer ────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 680 },
            p: 3,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>New booking</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Fill in the details below to create a booking
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

        <BookingForm
          onSave={handleCreate}
          onCancel={() => setDrawerOpen(false)}
          saving={saving}
        />
      </Drawer>
    </AppLayout>
  );
}
