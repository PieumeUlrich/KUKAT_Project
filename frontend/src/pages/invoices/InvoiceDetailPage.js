import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography,
  Button, Divider, Alert, Skeleton, IconButton, Drawer,
  Table, TableHead, TableRow, TableCell, TableBody, Chip,
  MenuItem, TextField, InputAdornment, CircularProgress,
} from '@mui/material';
import {
  ArrowBack, Receipt, AttachMoney, Person,
  Close, Add,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import { useInvoice } from '../../hooks/useModules';
import { invoicesApi } from '../../api/index.js';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

function InfoRow({ label, value }) {
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', py: 1.2,
      borderBottom: `1px solid ${KUKAT.border}`,
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Typography variant="body2" sx={{ color: KUKAT.textMuted, fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: KUKAT.navy, fontWeight: 600 }}>{value ?? '—'}</Typography>
    </Box>
  );
}

const fmt = (n) =>
  n != null
    ? `$${parseFloat(n).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
    : '—';

function AddPaymentForm({ invoiceID, totalAmount, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    amountPaid: '', paymentMethod: 'CARD', paymentType: 'full',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '', notes: '',
  });
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Amount paid *" type="number"
            value={form.amountPaid} onChange={set('amountPaid')}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth label="Payment method *"
            value={form.paymentMethod} onChange={set('paymentMethod')}>
            {['CARD', 'CASH', 'TRANSFER', 'CHECK'].map(m =>
              <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth label="Payment type"
            value={form.paymentType} onChange={set('paymentType')}>
            {['deposit', 'partial', 'full', 'refund'].map(t =>
              <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Payment date" type="date"
            value={form.paymentDate} onChange={set('paymentDate')}
            InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Reference / transaction #"
            value={form.reference} onChange={set('reference')} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Notes" multiline rows={2}
            value={form.notes} onChange={set('notes')} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving || !form.amountPaid}
          onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Record payment'}
        </Button>
      </Box>
    </Box>
  );
}

export default function InvoiceDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { canApprove } = useAuth();

  const { invoice, loading, error, refetch } = useInvoice(id);
  const [drawer,   setDrawer]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleAddPayment = useCallback(async (data) => {
    setSaving(true); setSaveErr('');
    try {
      await invoicesApi.addPayment(id, data);
      setDrawer(false);
      refetch();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to record payment.');
    } finally { setSaving(false); }
  }, [id, refetch]);

  const handleMarkPaid = useCallback(async () => {
    setMarkingPaid(true);
    try {
      await invoicesApi.markPaid(id);
      refetch();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to mark as paid.');
    } finally { setMarkingPaid(false); }
  }, [id, refetch]);

  if (loading) return (
    <AppLayout title="Invoice detail">
      <Skeleton variant="rounded" height={300} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={200} />
    </AppLayout>
  );

  if (error) return (
    <AppLayout title="Invoice detail">
      <Alert severity="error">{error}</Alert>
    </AppLayout>
  );

  const inv = invoice || {};
  const totalPaid = (inv.payments ?? []).reduce((s, p) =>
    p.status === 'completed' ? s + parseFloat(p.amountPaid || 0) : s, 0);
  const balance = parseFloat(inv.totalAmount || 0) - totalPaid;

  return (
    <AppLayout title={`Invoice #${inv.invoiceID}`} subtitle={inv.customerFirstName + ' ' + inv.customerLastName}>

      {/* Back + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBack />} variant="outlined" size="small"
          onClick={() => navigate('/invoices')}>
          Back to invoices
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {inv.status !== 'paid' && inv.status !== 'refunded' && canApprove() && (
            <Button variant="outlined" size="small" color="success"
              disabled={markingPaid}
              onClick={handleMarkPaid}>
              {markingPaid ? <CircularProgress size={16} /> : 'Mark as paid'}
            </Button>
          )}
          {inv.status !== 'paid' && inv.status !== 'refunded' && (
            <Button variant="contained" startIcon={<Add />} size="small"
              onClick={() => { setSaveErr(''); setDrawer(true); }}>
              Add payment
            </Button>
          )}
        </Box>
      </Box>

      {saveErr && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>{saveErr}</Alert>}

      <Grid container spacing={2.5}>

        {/* Invoice summary */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              avatar={<Receipt sx={{ color: KUKAT.teal }} />}
              title={`Invoice #${inv.invoiceID}`}
              subheader={`Booking #${inv.bookingID} · ${inv.productName || ''}`}
              action={<StatusChip status={inv.status} />}
            />
            <CardContent>
              <InfoRow label="Invoice date"
                value={inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Due date"
                value={inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Trip start"
                value={inv.tripStart ? new Date(inv.tripStart).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Trip end"
                value={inv.tripEnd ? new Date(inv.tripEnd).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Agent" value={inv.agentName} />
              <Divider sx={{ my: 1.5 }} />
              <InfoRow label="Subtotal"  value={fmt(inv.subtotal)} />
              <InfoRow label="Tax"       value={fmt(inv.taxAmount)} />
              <InfoRow label="Fees"      value={fmt(inv.feeAmount)} />
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={700} sx={{ color: KUKAT.navy }}>Total</Typography>
                <Typography fontWeight={700} sx={{ color: KUKAT.navy, fontSize: '1.1rem' }}>
                  {fmt(inv.totalAmount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={600} sx={{ color: '#15803D' }}>Paid</Typography>
                <Typography fontWeight={700} sx={{ color: '#15803D' }}>{fmt(totalPaid)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={600} sx={{ color: balance > 0 ? '#DC2626' : KUKAT.textMuted }}>
                  Balance due
                </Typography>
                <Typography fontWeight={700} sx={{ color: balance > 0 ? '#DC2626' : '#15803D' }}>
                  {fmt(balance)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer + booking */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardHeader avatar={<Person sx={{ color: KUKAT.teal }} />}
              title="Customer"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy } }} />
            <CardContent sx={{ pt: 0 }}>
              <Typography fontWeight={600} sx={{ color: KUKAT.navy }}>
                {inv.customerFirstName} {inv.customerLastName}
              </Typography>
              <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>{inv.customerEmail}</Typography>
              <Button size="small" variant="text" sx={{ mt: 1, px: 0 }}
                onClick={() => navigate(`/bookings/${inv.bookingID}`)}>
                View booking →
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          {inv.notes && (
            <Card>
              <CardHeader title="Notes"
                titleTypographyProps={{ variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy } }} />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>{inv.notes}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Payment history */}
        <Grid item xs={12}>
          <Card>
            <CardHeader avatar={<AttachMoney sx={{ color: KUKAT.amber }} />}
              title="Payment history"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }} />
            <CardContent sx={{ pt: 0 }}>
              {(inv.payments ?? []).length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                  No payments recorded yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount paid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(inv.payments ?? []).map((p) => (
                      <TableRow key={p.paymentID}>
                        <TableCell>
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-CA') : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip label={p.paymentMethod} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, borderRadius: '4px',
                              background: `${KUKAT.navy}10`, color: KUKAT.navy }} />
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{p.paymentType}</TableCell>
                        <TableCell sx={{ color: KUKAT.textMuted }}>{p.reference || '—'}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} sx={{ color: '#15803D' }}>
                            {fmt(p.amountPaid)}
                          </Typography>
                        </TableCell>
                        <TableCell><StatusChip status={p.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Add payment drawer */}
      <Drawer anchor="right" open={drawer}
        onClose={() => !saving && setDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>Record payment</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Invoice #{inv.invoiceID} · Balance due: {fmt(balance)}
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawer(false)} disabled={saving}><Close /></IconButton>
        </Box>
        {saveErr && <Alert severity="error" sx={{ mb: 2 }}>{saveErr}</Alert>}
        <AddPaymentForm invoiceID={id} totalAmount={inv.totalAmount}
          onSave={handleAddPayment} onCancel={() => setDrawer(false)} saving={saving} />
      </Drawer>

    </AppLayout>
  );
}