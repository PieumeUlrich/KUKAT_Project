import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography,
  Button, Alert, Skeleton, Divider, Avatar,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, MenuItem, TextField, InputAdornment,
  CircularProgress, Drawer, IconButton, Switch, FormControlLabel,
} from '@mui/material';
import {
  ArrowBack, AccountBalance, Person, AttachMoney,
  CheckCircle, Close, Star,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import { useCommissions } from '../../hooks/useModules';
import { commissionsApi } from '../../api/index.js';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

const InfoRow = ({ label, value }) => {
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

export default function CommissionDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { canApprove, isAccountant } = useAuth();

  // Reuse useCommissions but fetch single record via getById
  const [commission, setCommission] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await commissionsApi.getById(id);
      setCommission(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Commission not found.');
    } finally { setLoading(false); }
  }, [id]);

  React.useEffect(() => { fetch(); }, [fetch]);

  const [drawer,    setDrawer]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [approving, setApproving] = useState(false);

  const [payForm, setPayForm] = useState({
    paymentAmount: '', paymentMethod: 'TRANSFER',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '', isBonus: false, bonusReason: '',
  });
  const setP = (f) => (e) =>
    setPayForm(p => ({ ...p, [f]: e.target?.value ?? e }));

  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      await commissionsApi.approve(id);
      fetch();
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Failed to approve.');
    } finally { setApproving(false); }
  }, [id, fetch]);

  const handlePayment = useCallback(async () => {
    setSaving(true); setSaveErr('');
    try {
      await commissionsApi.addPayment(id, payForm);
      setDrawer(false);
      fetch();
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Failed to record payment.');
    } finally { setSaving(false); }
  }, [id, payForm, fetch]);

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

  return (
    <AppLayout title={`Commission #${c.commissionID}`} subtitle={c.agentName}>

      {/* Back + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBack />} variant="outlined" size="small"
          onClick={() => navigate('/commissions')}>
          Back to commissions
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {c.status === 'pending' && canApprove() && (
            <Button variant="outlined" color="success" size="small"
              startIcon={<CheckCircle />} disabled={approving}
              onClick={handleApprove}>
              {approving ? <CircularProgress size={16} /> : 'Approve'}
            </Button>
          )}
          {c.status === 'approved' && (isAccountant() || canApprove()) && (
            <Button variant="contained" startIcon={<AttachMoney />} size="small"
              onClick={() => { setSaveErr(''); setDrawer(true); }}>
              Record payment
            </Button>
          )}
        </Box>
      </Box>

      {saveErr && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>{saveErr}</Alert>}

      <Grid container spacing={2.5}>

        {/* Commission overview */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader
              avatar={<AccountBalance sx={{ color: '#7C3AED' }} />}
              title={`Commission #${c.commissionID}`}
              subheader={`Booking #${c.bookingID} · Invoice #${c.invoiceID}`}
              action={<StatusChip status={c.status} />}
            />
            <CardContent>
              <InfoRow label="Commission rate"    value={`${parseFloat(c.commissionRate || 0).toFixed(1)}%`} />
              <InfoRow label="Commission amount"  value={fmt(c.commissionAmount)} />
              <InfoRow label="Booking base price" value={fmt(c.basePrice)} />
              <InfoRow label="Invoice total"      value={fmt(c.invoiceTotal)} />
              <InfoRow label="Invoice status"     value={c.invoiceStatus} />
              <InfoRow label="Created"
                value={c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-CA') : null} />
              {c.approvedAt && (
                <InfoRow label="Approved"
                  value={new Date(c.approvedAt).toLocaleDateString('en-CA')} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Agent card */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader avatar={<Person sx={{ color: KUKAT.teal }} />}
              title="Agent"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy } }} />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 44, height: 44, fontSize: '1rem', fontWeight: 700,
                  background: `linear-gradient(135deg, ${KUKAT.amber}, ${KUKAT.amberDark})`,
                  color: KUKAT.navy,
                }}>
                  {c.agentName?.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} sx={{ color: KUKAT.navy }}>{c.agentName}</Typography>
                  <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                    Code: {c.agentCode}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>Commission earned</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#15803D', fontSize: '1rem' }}>
                  {fmt(c.commissionAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment history */}
        <Grid item xs={12}>
          <Card>
            <CardHeader avatar={<AttachMoney sx={{ color: KUKAT.amber }} />}
              title="Payment history"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }} />
            <CardContent sx={{ pt: 0 }}>
              {(c.payments ?? []).length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                  No payments recorded yet.
                  {c.status === 'approved' && ' Use "Record payment" above to pay this commission.'}
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(c.payments ?? []).map((p) => (
                      <TableRow key={p.commPaymentID}>
                        <TableCell>
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-CA') : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip label={p.paymentMethod} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, borderRadius: '4px',
                              background: `${KUKAT.navy}10`, color: KUKAT.navy }} />
                        </TableCell>
                        <TableCell sx={{ color: KUKAT.textMuted }}>{p.reference || '—'}</TableCell>
                        <TableCell>
                          {p.isBonus ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Star sx={{ fontSize: 14, color: KUKAT.amber }} />
                              <Typography variant="caption" sx={{ color: KUKAT.amber, fontWeight: 600 }}>
                                Bonus
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>Regular</Typography>
                          )}
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
        </Grid>

      </Grid>

      {/* Record payment drawer */}
      <Drawer anchor="right" open={drawer}
        onClose={() => !saving && setDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>Record commission payment</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              To: {c.agentName} · Amount due: {fmt(c.commissionAmount)}
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawer(false)} disabled={saving}><Close /></IconButton>
        </Box>
        {saveErr && <Alert severity="error" sx={{ mb: 2 }}>{saveErr}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Amount *" type="number"
              value={payForm.paymentAmount} onChange={setP('paymentAmount')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Method *"
              value={payForm.paymentMethod} onChange={setP('paymentMethod')}>
              {['TRANSFER', 'CHEQUE', 'CASH'].map(m =>
                <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Payment date" type="date"
              value={payForm.paymentDate} onChange={setP('paymentDate')}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Reference"
              value={payForm.reference} onChange={setP('reference')} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch checked={payForm.isBonus}
                  onChange={(e) => setPayForm(p => ({ ...p, isBonus: e.target.checked }))} />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star sx={{ fontSize: 16, color: KUKAT.amber }} />
                  <Typography variant="body2" fontWeight={500}>This is a bonus payment</Typography>
                </Box>
              }
            />
          </Grid>
          {payForm.isBonus && (
            <Grid item xs={12}>
              <TextField fullWidth label="Bonus reason"
                value={payForm.bonusReason} onChange={setP('bonusReason')}
                placeholder="e.g. Q4 performance bonus" />
            </Grid>
          )}
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" onClick={() => setDrawer(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" disabled={saving || !payForm.paymentAmount}
            onClick={handlePayment}>
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Record payment'}
          </Button>
        </Box>
      </Drawer>

    </AppLayout>
  );
}