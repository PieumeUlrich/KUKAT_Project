import React, { useState, useCallback } from 'react';
import {
  Box, Button, Typography, TextField, MenuItem,
  Card, CardContent, Drawer, IconButton,
  InputAdornment, Tooltip, Alert, Chip,
} from '@mui/material';
import {
  Add, Search, Close, Refresh, Download,
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
import exportToCsv from '../../utils/exportCsv';

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, loading }) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
      <Box sx={{
        width: 44, height: 44, borderRadius: '11px', flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{
          fontSize: '1.45rem', fontWeight: 700,
          color: KUKAT.navy, lineHeight: 1,
        }}>
          {loading ? '…' : value}
        </Typography>
        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
          {label}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Column definitions ────────────────────────────────────────
const COLUMNS = [
  { id: 'bookingID',    label: 'ID',         minWidth: 70 },
  { id: 'customerName', label: 'Customer',   minWidth: 160 },
  // ← productNames replaces productName — multi-item booking
  { id: 'productNames', label: 'Products',   minWidth: 220,
    render: (v) => v ? (
      <Typography variant="body2" sx={{
        maxWidth: 220, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {v}
      </Typography>
    ) : '—' },
  // ← itemCount shows how many products in the booking
  { id: 'itemCount',    label: 'Items',      minWidth: 70, align: 'center',
    render: (v) => (
      <Chip label={v ?? 0} size="small"
        sx={{ background: `${KUKAT.navy}15`, color: KUKAT.navy,
          fontWeight: 700, fontSize: '0.75rem' }} />
    )},
  { id: 'memberCount',  label: 'Travellers', minWidth: 90, align: 'center' },
  { id: 'tripStart',    label: 'Trip start', minWidth: 110,
    render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
  { id: 'tripEnd',      label: 'Trip end',   minWidth: 110,
    render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
  { id: 'basePrice',    label: 'Total',      minWidth: 120, align: 'right',
    render: (v) => v != null ? (
      <Typography fontWeight={700} sx={{ color: KUKAT.navy, fontSize: '0.875rem' }}>
        ${parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
      </Typography>
    ) : '—' },
  { id: 'status',       label: 'Status',     minWidth: 110, sortable: false,
    render: (v) => <StatusChip status={v} /> },
  { id: 'agentName',    label: 'Agent',      minWidth: 140 },
];

const CSV_COLUMNS = [
  { id: 'bookingID',    label: 'Booking ID' },
  { id: 'customerName', label: 'Customer' },
  { id: 'agentName',    label: 'Agent' },
  { id: 'productNames', label: 'Products' },   // ← updated
  { id: 'itemCount',    label: 'Item count' }, // ← added
  { id: 'memberCount',  label: 'Travellers' },
  { id: 'bookingDate',  label: 'Booking date' },
  { id: 'tripStart',    label: 'Trip start' },
  { id: 'tripEnd',      label: 'Trip end' },
  { id: 'basePrice',    label: 'Total price' },
  { id: 'status',       label: 'Status' },
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

  const { bookings, loading, error, total, refetch } = useBookings({ search, status });
  const { stats: globalStats, loading: statsLoading } = useBookingStats();

  const stats = {
    total:     globalStats?.total     ?? 0,
    confirmed: globalStats?.confirmed ?? 0,
    pending:   globalStats?.pending   ?? 0,
    completed: globalStats?.completed ?? 0,
    cancelled: globalStats?.cancelled ?? 0,
  };

  const handleCreate = useCallback(async (formData) => {
    setSaving(true); setSaveError('');
    try {
      await bookingsApi.create(formData);
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to create booking.');
    } finally { setSaving(false); }
  }, [refetch]);

  return (
    <AppLayout
      title="Bookings"
      subtitle={`${total} total booking${total !== 1 ? 's' : ''}`}>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
        gap: 2, mb: 3,
      }}>
        <StatCard label="Total"     value={stats.total}
          icon={<BookOnline />}     color={KUKAT.navy}  loading={statsLoading} />
        <StatCard label="Confirmed" value={stats.confirmed}
          icon={<CheckCircle />}    color="#15803D"     loading={statsLoading} />
        <StatCard label="Pending"   value={stats.pending}
          icon={<HourglassEmpty />} color={KUKAT.amber} loading={statsLoading} />
        <StatCard label="Completed" value={stats.completed}
          icon={<CheckCircle />}    color={KUKAT.teal}  loading={statsLoading} />
        <StatCard label="Cancelled" value={stats.cancelled}
          icon={<Cancel />}         color="#DC2626"     loading={statsLoading} />
      </Box>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 2, mb: 2.5,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <TextField
          placeholder="Search customer, product, ID…"
          size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
            </InputAdornment>
          )}}
        />
        <TextField select size="small" label="Status" value={status}
          onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
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
        <Tooltip title="Download CSV">
          <IconButton
            onClick={() => exportToCsv('kukat_bookings', bookings, CSV_COLUMNS)}
            size="small" sx={{ color: KUKAT.textMuted }}>
            <Download />
          </IconButton>
        </Tooltip>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => { setSaveError(''); setDrawerOpen(true); }}>
          New booking
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS} rows={bookings} loading={loading}
        keyField="bookingID"
        onRowClick={(row) => navigate(`/bookings/${row.bookingID}`)}
        emptyMessage="No bookings found. Create one to get started."
      />

      {/* ── Create drawer ─────────────────────────────────────── */}
      <Drawer anchor="right" open={drawerOpen}
        onClose={() => !saving && setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 720 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>New booking</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Add products, travellers and pricing below
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