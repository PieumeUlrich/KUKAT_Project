import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, MenuItem, Card, CardContent, Tooltip,
  Typography, Drawer, IconButton, InputAdornment, Alert, CircularProgress,
} from '@mui/material';
import { Download, Search, Close, Receipt, AttachMoney, HourglassEmpty, CheckCircle, Cancel } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { useInvoices, useInvoiceStats } from '../../hooks/useModules';
import { invoicesApi } from '../../api/index';
import exportToCsv from '../../utils/exportCsv';
import { KUKAT } from '../../styles/theme';

function StatCard({ label, value, icon, color, loading, prefix = '' }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '11px', background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1 }}>
            {loading ? '…' : `${prefix}${value}`}
          </Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const STATUS_FILTERS = ['', 'unpaid', 'partial', 'paid', 'refunded'];

const COLUMNS = [
  { id: 'invoiceID',   label: 'Invoice #', minWidth: 100 },
  { id: 'bookingID',   label: 'Booking',   minWidth: 90 },
  { id: 'customerName',label: 'Customer',  minWidth: 180 },
  { id: 'invoiceDate', label: 'Date',      minWidth: 110,
    render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
  { id: 'dueDate',     label: 'Due',       minWidth: 110,
    render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
  { id: 'subtotal',    label: 'Subtotal',  minWidth: 110, align: 'right',
    render: (v) => v != null ? `$${parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : '—' },
  { id: 'totalAmount', label: 'Total',     minWidth: 120, align: 'right',
    render: (v) => v != null ? (
      <Typography fontWeight={700} sx={{ color: KUKAT.navy, fontSize: '0.875rem' }}>
        ${parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
      </Typography>
    ) : '—' },
  { id: 'status',      label: 'Status',    minWidth: 110, sortable: false,
    render: (v) => <StatusChip status={v} /> },
];

const CSV_COLUMNS = [
  { id: 'invoiceID',     label: 'Invoice ID' },
  { id: 'customerName',  label: 'Customer' },
  { id: 'bookingID',     label: 'Booking ID' },
  { id: 'invoiceDate',   label: 'Invoice date' },
  { id: 'dueDate',       label: 'Due date' },
  { id: 'totalAmount',   label: 'Total amount' },
  { id: 'status',        label: 'Status' },
];

// ── Add payment form ──────────────────────────────────────────
function AddPaymentForm({ invoiceID, totalAmount, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    amountPaid: '', paymentMethod: 'CARD', paymentType: 'full',
    paymentDate: new Date().toISOString().split('T')[0], reference: '', notes: '',
  });
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Amount paid" type="number"
          value={form.amountPaid} onChange={set('amountPaid')}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />

        <TextField select fullWidth label="Payment method"
          value={form.paymentMethod} onChange={set('paymentMethod')}>
          {['CARD', 'CASH', 'TRANSFER', 'CHECK'].map(m =>
            <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>

        <TextField select fullWidth label="Payment type"
          value={form.paymentType} onChange={set('paymentType')}>
          {['deposit', 'partial', 'full', 'refund'].map(t =>
            <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
        </TextField>

        <TextField fullWidth label="Payment date" type="date"
          value={form.paymentDate} onChange={set('paymentDate')}
          InputLabelProps={{ shrink: true }} />
      </Box>

      <TextField fullWidth label="Reference / transaction #"
        value={form.reference} onChange={set('reference')} />

      <TextField fullWidth label="Notes" multiline rows={2}
        value={form.notes} onChange={set('notes')} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving || !form.amountPaid}
          onClick={() => onSave({ ...form, invoiceID })}>
          {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Record payment'}
        </Button>
      </Box>

    </Box>  );
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [drawer,     setDrawer]     = useState({ open: false, invoiceID: null, total: 0 });
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const { invoices: rawInvoices, loading, error, total, refetch } = useInvoices({ search, status });
  const { stats: globalStats } = useInvoiceStats();
  const invoices = rawInvoices ?? [];

  const totalRevenue  = globalStats?.totalCollected ?? 0;
  const totalUnpaid   = globalStats?.unpaid         ?? 0;
  const totalPaid     = globalStats?.paid           ?? 0;
  const totalRefunded = globalStats?.refunded       ?? 0;

  const handlePayment = useCallback(async (data) => {
    setSaving(true); setSaveError('');
    try {
      await invoicesApi.addPayment(drawer.invoiceID, data);
      setDrawer({ open: false, invoiceID: null, total: 0 });
      refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to record payment.');
    } finally { setSaving(false); }
  }, [drawer.invoiceID, refetch]);

  return (
    <AppLayout title="Invoices" subtitle={`${total} total invoice${total !== 1 ? 's' : ''}`}>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <StatCard label="Total invoices" value={total}
          icon={<Receipt />} color={KUKAT.navy} loading={loading} />
        <StatCard label="Revenue collected"
          value={totalRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
          icon={<AttachMoney />} color="#15803D" loading={loading} prefix="$" />
        <StatCard label="Unpaid" value={totalUnpaid}
          icon={<HourglassEmpty />} color={KUKAT.amber} loading={loading} />
        <StatCard label="Paid" value={totalPaid}
          icon={<CheckCircle />} color={KUKAT.teal} loading={loading} />
        <StatCard label="Refunded" value={totalRefunded}
          icon={<Cancel />} color="#5f44ef" loading={loading} />
      </Box>

      {/* ── Search + filters ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto' },
        gap: 1.5,
        alignItems: 'center',
        mb: 2.5,
      }}>
        <TextField placeholder="Search invoice #, customer, booking…"
          size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
            </InputAdornment>
          )}}
        />
        <Tooltip title="Export current view to CSV">
          <IconButton
            onClick={() => exportToCsv('kukat_invoices', invoices, CSV_COLUMNS)}
            size="small"
            sx={{ color: KUKAT.textMuted }}
            title="Export to CSV"
          >
            <Download />
          </IconButton>
        </Tooltip>
        <TextField select size="small" label="Status"
          value={status} onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 140 }}>
          {STATUS_FILTERS.map(s => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s || 'All statuses'}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS} rows={invoices} loading={loading}
        keyField="invoiceID"
        onRowClick={(row) => navigate(`/invoices/${row.invoiceID}`)}
        emptyMessage="No invoices found."
      />

      {/* ── Add payment drawer ───────────────────────────────── */}
      <Drawer anchor="right" open={drawer.open}
        onClose={() => !saving && setDrawer({ open: false, invoiceID: null, total: 0 })}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>Record payment</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Invoice #{drawer.invoiceID} — Total: ${parseFloat(drawer.total || 0).toFixed(2)}
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawer({ open: false, invoiceID: null, total: 0 })}>
            <Close />
          </IconButton>
        </Box>
        {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
        <AddPaymentForm
          invoiceID={drawer.invoiceID}
          totalAmount={drawer.total}
          onSave={handlePayment}
          onCancel={() => setDrawer({ open: false })}
          saving={saving}
        />
      </Drawer>

    </AppLayout>
   );
}
