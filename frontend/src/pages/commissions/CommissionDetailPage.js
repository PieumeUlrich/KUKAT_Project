import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, CardHeader, Typography,
  Button, Alert, Skeleton, Divider,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, MenuItem, TextField, InputAdornment,
  CircularProgress, Drawer, IconButton,
} from '@mui/material';
import {
  ArrowBack, AccountBalance, Business, AttachMoney,
  CheckCircle, Close, Warning,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import { commissionsApi } from '../../api/index.js';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

const InfoRow = ({ label, value }) => (
  <Box sx={{
    display: 'flex', justifyContent: 'space-between', py: 1.2,
    borderBottom: `1px solid ${KUKAT.border}`,
    '&:last-child': { borderBottom: 'none' },
  }}>
    <Typography variant="body2" sx={{ color: KUKAT.textMuted, fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: KUKAT.navy, fontWeight: 600 }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

const fmt = (n) =>
  n != null
    ? `$${parseFloat(n).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
    : '—';

export default function CommissionDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canApprove = ['superadmin', 'manager'].includes(user?.role);
  const canRecord  = ['superadmin', 'accountant'].includes(user?.role);

  const [commission, setCommission] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await commissionsApi.getById(id);
      setCommission(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Commission not found.');
    } finally { setLoading(false); }
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  const [drawer,    setDrawer]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [approving, setApproving] = useState(false);

  const [payForm, setPayForm] = useState({
    paymentAmount:   '',
    paymentMethod:   'TRANSFER',
    paymentDate:     new Date().toISOString().split('T')[0],
    processedBy:    '',
    reference: '',
  });
  const setP = (f) => (e) => setPayForm(p => ({ ...p, [f]: e.target.value }));

  const handleApprove = useCallback(async () => {
    setApproving(true); setSaveErr('');
    try {
      await commissionsApi.approve(id);
      load();
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Failed to approve.');
    } finally { setApproving(false); }
  }, [id, load]);

  const handlePayment = useCallback(async () => {
    setSaving(true); setSaveErr('');
    try {
      await commissionsApi.addPayment(id, payForm);
      setDrawer(false);
      load();
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Failed to record payment.');
    } finally { setSaving(false); }
  }, [id, payForm, load]);

  if (loading) return (
    <AppLayout title="Commission detail">
      <Skeleton variant="rounded" height={300} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={200} />
    </AppLayout>
  );

  if (error) return (
    <AppLayout title="Commission detail">
      <Alert severity="error">{error}</Alert>
    </AppLayout>
  );

  const c = commission || {};
  const isOverdue = c.isOverdue;
  const dueDate   = c.dueDate
    ? new Date(c.dueDate).toLocaleDateString('en-CA')
    : null;

  return (
    <AppLayout
      title={`Commission #${c.commissionID}`}
      subtitle={c.supplierName || c.agentName}>

      {/* ── Back + actions ─────────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5, mb: 3,
      }}>
        <Button startIcon={<ArrowBack />} variant="outlined" size="small"
          onClick={() => navigate('/commissions')}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Back to commissions
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Overdue warning badge */}
          {isOverdue && (
            <Chip icon={<Warning />} label="Overdue" size="small"
              sx={{ background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }} />
          )}
          {c.status === 'pending' && canApprove && (
            <Button variant="outlined" color="success" size="small"
              startIcon={<CheckCircle />} disabled={approving}
              onClick={handleApprove}>
              {approving ? <CircularProgress size={16} /> : 'Verify'}
            </Button>
          )}
          {c.status === 'approved' && canRecord && (
            <Button variant="contained" startIcon={<AttachMoney />} size="small"
              onClick={() => { setSaveErr(''); setDrawer(true); }}>
              Record receipt
            </Button>
          )}
        </Box>
      </Box>

      {saveErr && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>
          {saveErr}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── Commission overview + Supplier side by side ──── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          gap: 2.5, alignItems: 'start',
        }}>

          {/* Commission overview */}
          <Card>
            <CardHeader
              avatar={<AccountBalance sx={{ color: '#7C3AED' }} />}
              title={`Commission #${c.commissionID}`}
              subheader={`Booking #${c.bookingID} · Invoice #${c.invoiceID}`}
              action={<StatusChip status={c.status} />}
            />
            <CardContent>
              <InfoRow label="Commission rate"
                value={`${parseFloat(c.commissionRate || 0).toFixed(1)}%`} />
              <InfoRow label="Commission amount" value={fmt(c.commissionAmount)} />
              <InfoRow label="Booking base price" value={fmt(c.basePrice)} />
              <InfoRow label="Invoice total"      value={fmt(c.invoiceTotal)} />
              <InfoRow label="Invoice status"     value={c.invoiceStatus} />
              <InfoRow label="Trip end"
                value={c.tripEnd
                  ? new Date(c.tripEnd).toLocaleDateString('en-CA')
                  : null} />
              {/* Due date with overdue highlight */}
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', py: 1.2,
                borderBottom: `1px solid ${KUKAT.border}`,
              }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, fontWeight: 500 }}>
                  Due date
                </Typography>
                <Typography variant="body2" fontWeight={600}
                  sx={{ color: isOverdue ? '#DC2626' : KUKAT.navy }}>
                  {dueDate ?? '—'}
                  {isOverdue && ' ⚠ Overdue'}
                </Typography>
              </Box>
              <InfoRow label="Created"
                value={c.createdAt
                  ? new Date(c.createdAt).toLocaleDateString('en-CA')
                  : null} />
              {c.approvedAt && (
                <InfoRow label="Verified"
                  value={new Date(c.approvedAt).toLocaleDateString('en-CA')} />
              )}
              <InfoRow label="Agent (sale made by)" value={c.agentName} />
            </CardContent>
          </Card>

          {/* ← Supplier card — replaces Agent card */}
          <Card>
            <CardHeader
              avatar={<Business sx={{ color: KUKAT.teal }} />}
              title="Supplier"
              titleTypographyProps={{
                variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy }
              }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography fontWeight={700} sx={{ color: KUKAT.navy, mb: 0.5 }}>
                {c.supplierName ?? '—'}
              </Typography>
              <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 1.5 }}>
                Commission rate: {parseFloat(c.commissionRate || 0).toFixed(1)}%
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                  Amount owed to agency
                </Typography>
                <Typography variant="body2" fontWeight={700}
                  sx={{ color: '#15803D', fontSize: '1rem' }}>
                  {fmt(c.commissionAmount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                  Due by
                </Typography>
                <Typography variant="body2" fontWeight={600}
                  sx={{ color: isOverdue ? '#DC2626' : KUKAT.navy }}>
                  {dueDate ?? '—'}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" fullWidth sx={{ mt: 2 }}
                onClick={() => navigate(`/suppliers/${c.supplierID}`)}>
                View supplier →
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* ── Payment history ────────────────────────────────── */}
        <Card>
          <CardHeader
            avatar={<AttachMoney sx={{ color: KUKAT.amber }} />}
            title="Receipt history"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
          />
          <CardContent sx={{ pt: 0 }}>
            {(c.payments ?? []).length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                No receipts recorded yet.
                {c.status === 'approved' &&
                  ' Use "Record receipt" above once payment is received from the supplier.'}
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Ref #</TableCell>
                    <TableCell>Received from</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(c.payments ?? []).map((p) => (
                    <TableRow key={p.commPaymentID}>
                      <TableCell>
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString('en-CA')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={p.paymentMethod} size="small"
                          sx={{ fontSize: '0.7rem', height: 20, borderRadius: '4px',
                            background: `${KUKAT.navy}10`, color: KUKAT.navy }} />
                      </TableCell>
                      <TableCell sx={{ color: KUKAT.textMuted }}>
                        {p.reference || '—'}
                      </TableCell>
                      <TableCell sx={{ color: KUKAT.textMuted }}>
                        {p.processedBy || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} sx={{ color: '#15803D' }}>
                          {fmt(p.paymentAmount)}
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
      </Box>

      {/* ── Record receipt drawer ───────────────────────────── */}
      <Drawer anchor="right" open={drawer}
        onClose={() => !saving && setDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              Record receipt from supplier
            </Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Commission #{c.commissionID} · Expected: {fmt(c.commissionAmount)}
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawer(false)} disabled={saving}>
            <Close />
          </IconButton>
        </Box>

        {saveErr && <Alert severity="error" sx={{ mb: 2 }}>{saveErr}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}>
            <TextField fullWidth label="Amount received *" type="number"
              value={payForm.paymentAmount} onChange={setP('paymentAmount')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }} />
            <TextField select fullWidth label="Method *"
              value={payForm.paymentMethod} onChange={setP('paymentMethod')}>
              {['TRANSFER', 'CHEQUE', 'CASH', 'EFT'].map(m =>
                <MenuItem key={m} value={m}>{m}</MenuItem>
              )}
            </TextField>
            <TextField fullWidth label="Receipt date" type="date"
              value={payForm.paymentDate} onChange={setP('paymentDate')}
              InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Reference number"
              value={payForm.reference} onChange={setP('reference')}
              placeholder="e.g. CHQ-00123" />
          </Box>

          <TextField fullWidth label="Received from (supplier contact)"
            value={payForm.processedBy} onChange={setP('processedBy')}
            placeholder="e.g. John Smith — Accounts Payable" />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
            <Button variant="outlined" onClick={() => setDrawer(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="contained"
              disabled={saving || !payForm.paymentAmount}
              onClick={handlePayment}>
              {saving
                ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                : 'Record receipt'}
            </Button>
          </Box>
        </Box>
      </Drawer>

    </AppLayout>
  );
}