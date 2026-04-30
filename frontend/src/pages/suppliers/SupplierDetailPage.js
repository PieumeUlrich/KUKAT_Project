import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, CardHeader, Typography, Button,
  Alert, Skeleton, Divider, Avatar, Chip, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  Drawer, TextField, Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import {
  ArrowBack, Business, Edit, CheckCircle,
  AccountBalance, Close, Warning, AttachMoney,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import { useSupplier } from '../../hooks/useModules';
import { suppliersApi } from '../../api/index';
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

// ── Edit form ─────────────────────────────────────────────────
function SupplierForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    supplierName:    '',
    contactName:     '',
    email:           '',
    phone:           '',
    address:         '',
    city:            '',
    country:         '',
    commissionRate:  '10',
    affiliationCode: '',
    notes:           '',
    isActive:        true,
    ...initial,
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField fullWidth label="Supplier name *" value={form.supplierName}
        onChange={set('supplierName')}
        error={!!errors.supplierName} helperText={errors.supplierName} />

      <Divider><Typography variant="caption">Contact</Typography></Divider>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField fullWidth label="Contact name" value={form.contactName} onChange={set('contactName')} />
        <TextField fullWidth label="Representative" value={form.representative} onChange={set('representative')} />
        <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />
        <TextField fullWidth label="Phone number" value={form.phoneNumber} onChange={set('phoneNumber')} />
        <TextField fullWidth label="Fax" value={form.fax} onChange={set('fax')} />
        <TextField fullWidth label="Website" value={form.website} onChange={set('website')} />
        <TextField fullWidth label="Commission rate (%)" type="number"
          value={form.commissionRate} onChange={set('commissionRate')}
          error={!!errors.commissionRate}
          helperText={errors.commissionRate || 'e.g. 10 = 10%'}
          inputProps={{ min: 0, max: 100, step: 0.1 }} />
        <TextField fullWidth label="Affiliation code" value={form.affiliationCode}
          onChange={set('affiliationCode')} helperText="e.g. IATA, TICO, ACTA" />
      </Box>

      <Divider><Typography variant="caption">Address</Typography></Divider>

      <TextField fullWidth label="Address line 1" value={form.address1} onChange={set('address1')} />
      <TextField fullWidth label="Address line 2" value={form.address2} onChange={set('address2')} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField fullWidth label="City"        value={form.city}       onChange={set('city')} />
        <TextField fullWidth label="Province"    value={form.province}   onChange={set('province')} />
        <TextField fullWidth label="Postal code" value={form.postalCode} onChange={set('postalCode')} />
        <TextField fullWidth label="Country"     value={form.country}    onChange={set('country')} />
      </Box>

      <TextField fullWidth label="Affiliation code"
        value={form.affiliationCode} onChange={set('affiliationCode')}
        helperText="e.g. IATA, TICO, ACTA" />

      <TextField fullWidth label="Notes" multiline rows={2}
        value={form.notes} onChange={set('notes')} />

      <FormControlLabel
        control={
          <Switch checked={!!form.isActive}
            onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
        }
        label="Supplier is active"
      />

      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 1, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving}
          onClick={() => { if (validate()) onSave(form); }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : 'Save changes'}
        </Button>
      </Box>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function SupplierDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit  = ['superadmin', 'manager'].includes(user?.role);

  const { supplier, loading, error, refetch } = useSupplier(id);
  const [editOpen,  setEditOpen]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [actionErr, setActionErr] = useState('');

  const handleEdit = useCallback(async (data) => {
    setSaving(true); setSaveErr('');
    try {
      await suppliersApi.update(id, data);
      setEditOpen(false);
      refetch();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  }, [id, refetch]);

  const handleDeactivate = useCallback(async () => {
    setActionErr('');
    try {
      await suppliersApi.deactivate(id);
      refetch();
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Deactivation failed.');
    }
  }, [id, refetch]);

  const handleActivate = useCallback(async () => {
    setActionErr('');
    try {
      await suppliersApi.activate(id);
      refetch();
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Activation failed.');
    }
  }, [id, refetch]);

  if (loading) return (
    <AppLayout title="Supplier detail">
      <Skeleton variant="rounded" height={300} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={200} />
    </AppLayout>
  );

  if (error) return (
    <AppLayout title="Supplier detail">
      <Alert severity="error">{error}</Alert>
    </AppLayout>
  );

  const s            = supplier || {};
  const commissions  = s.commissions ?? [];
  const products     = s.products    ?? [];
  const overdueComms = commissions.filter(c => c.isOverdue);

  return (
    <AppLayout
      title={s.supplierName || 'Supplier'}
      subtitle={
        [s.city, s.country].filter(Boolean).join(', ')
        || `Supplier #${s.supplierID}`
      }>

      {/* ── Back + actions ─────────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5, mb: 3,
      }}>
        <Button startIcon={<ArrowBack />} variant="outlined" size="small"
          onClick={() => navigate('/suppliers')}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Back to suppliers
        </Button>
        {canEdit && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {s.isActive ? (
              <Button variant="outlined" size="small" color="error"
                onClick={handleDeactivate}>
                Deactivate
              </Button>
            ) : (
              <Button variant="outlined" size="small" color="success"
                onClick={handleActivate}>
                Activate
              </Button>
            )}
            <Button variant="outlined" size="small" startIcon={<Edit />}
              onClick={() => { setSaveErr(''); setEditOpen(true); }}>
              Edit
            </Button>
          </Box>
        )}
      </Box>

      {actionErr && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionErr('')}>
          {actionErr}
        </Alert>
      )}

      {/* Overdue alert */}
      {overdueComms.length > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          {overdueComms.length} overdue commission{overdueComms.length > 1 ? 's' : ''} from
          this supplier — total overdue:{' '}
          {fmt(overdueComms.reduce(
            (sum, c) => sum + parseFloat(c.commissionAmount || 0), 0
          ))}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* ── Profile + commission summary ───────────────────── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5, alignItems: 'start',
        }}>

          {/* Supplier profile */}
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{
                  width: 48, height: 48, fontSize: '1rem', fontWeight: 700,
                  background: `linear-gradient(135deg, ${KUKAT.navy}, ${KUKAT.navyLight})`,
                  color: '#fff',
                }}>
                  {s.supplierName?.slice(0, 2).toUpperCase()}
                </Avatar>
              }
              title={s.supplierName}
              subheader={[s.city, s.country].filter(Boolean).join(', ')}
              action={
                <Chip
                  label={s.isActive ? 'Active' : 'Inactive'} size="small"
                  sx={{
                    background: s.isActive ? '#DCFCE7' : '#FEE2E2',
                    color:      s.isActive ? '#15803D' : '#DC2626',
                    fontWeight: 700,
                  }}
                />
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <InfoRow label="Contact"        value={s.contactName} />
              <InfoRow label="Representative" value={s.representative} />
              <InfoRow label="Email"          value={s.email} />
              <InfoRow label="Phone"          value={s.phoneNumber} />
              <InfoRow label="Fax"            value={s.fax} />
              <InfoRow label="Website"        value={s.website} />
              <InfoRow label="Address"
                value={[s.address1, s.address2].filter(Boolean).join(', ')} />
              <InfoRow label="City / Province"
                value={[s.city, s.province, s.postalCode].filter(Boolean).join(', ')} />
              <InfoRow label="Country"        value={s.country} />
              {s.notes && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ color: KUKAT.navy, mt: 0.5 }}>
                    {s.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* Commission summary */}
          <Card>
            <CardHeader
              avatar={<AccountBalance sx={{ color: KUKAT.teal }} />}
              title="Commission summary"
              titleTypographyProps={{
                variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy }
              }}
            />
            <CardContent sx={{ pt: 0 }}>
              {/* Rate highlight */}
              <Box sx={{
                p: 2, borderRadius: 2, background: '#DCFCE7',
                border: '1px solid #BBF7D0', mb: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Typography variant="body2" sx={{ color: '#15803D', fontWeight: 600 }}>
                  Commission rate
                </Typography>
                <Typography sx={{
                  fontSize: '1.6rem', fontWeight: 800,
                  color: '#15803D', lineHeight: 1,
                }}>
                  {parseFloat(s.commissionRate || 0).toFixed(1)}%
                </Typography>
              </Box>

              <InfoRow label="Total commissions"    value={s.totalCommissions ?? 0} />
              <InfoRow label="Total received"        value={fmt(s.totalReceived)} />
              <InfoRow label="Pending from supplier" value={fmt(s.totalPending)} />
              <InfoRow label="Overdue count"
                value={
                  <Box component="span" sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color: (s.overdueCount ?? 0) > 0 ? '#DC2626' : KUKAT.navy,
                  }}>
                    {(s.overdueCount ?? 0) > 0 && (
                      <Warning sx={{ fontSize: 14 }} />
                    )}
                    {s.overdueCount ?? 0}
                  </Box>
                }
              />
              <Divider sx={{ my: 1.5 }} />
              <InfoRow label="Total bookings"  value={s.totalBookings  ?? 0} />
              <InfoRow label="Total revenue"   value={fmt(s.totalRevenue)} />
              <InfoRow label="Products listed" value={s.productCount   ?? 0} />

              <Button size="small" variant="outlined" fullWidth sx={{ mt: 2 }}
                onClick={() => navigate(`/commissions?supplierID=${s.supplierID}`)}>
                View all commissions →
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* ── Products — one supplier, many products ─────────── */}
        <Card>
          <CardHeader
            avatar={<Business sx={{ color: KUKAT.amber }} />}
            title="Products offered"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
            subheader={
              `${products.length} product${products.length !== 1 ? 's' : ''} from ${s.supplierName || 'this supplier'}`
            }
            subheaderTypographyProps={{ variant: 'caption' }}
            action={
              canEdit && (
                <Button size="small" variant="outlined"
                  onClick={() => navigate('/packages')}>
                  Manage products →
                </Button>
              )
            }
          />
          <CardContent sx={{ pt: 0 }}>
            {products.length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                No products listed for this supplier yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Bookings</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p, i) => (
                    <TableRow key={p.productID}
                      sx={{ background: i % 2 === 0 ? '#fff' : KUKAT.surface }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {p.productName}
                        </Typography>
                        {p.description && (
                          <Typography variant="caption" sx={{
                            color: KUKAT.textMuted,
                            display: '-webkit-box', WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {p.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {p.categoryName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {p.bookingCount ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}
                          sx={{ color: KUKAT.teal }}>
                          {fmt(p.revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.isActive ? 'Active' : 'Inactive'} size="small"
                          sx={{ fontSize: '0.68rem', height: 18,
                            background: p.isActive ? '#DCFCE7' : '#FEE2E2',
                            color:      p.isActive ? '#15803D' : '#DC2626' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ── Recent commissions ────────────────────────────── */}
        <Card>
          <CardHeader
            avatar={<AttachMoney sx={{ color: '#7C3AED' }} />}
            title="Recent commissions"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
            subheader="Money owed to the agency by this supplier"
            subheaderTypographyProps={{ variant: 'caption' }}
          />
          <CardContent sx={{ pt: 0 }}>
            {commissions.length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                No commissions recorded yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Booking</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Due date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissions.map((c, i) => (
                    <TableRow key={c.commissionID}
                      sx={{
                        cursor: 'pointer',
                        background: i % 2 === 0 ? '#fff' : KUKAT.surface,
                        '&:hover': { background: KUKAT.surfaceAlt },
                      }}
                      onClick={() => navigate(`/commissions/${c.commissionID}`)}>
                      <TableCell>#{c.commissionID}</TableCell>
                      <TableCell>
                        <Button size="small" variant="text"
                          sx={{ p: 0, minWidth: 0, fontSize: '0.82rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/${c.bookingID}`);
                          }}>
                          #{c.bookingID}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {c.agentName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}
                          sx={{ color: '#15803D' }}>
                          {fmt(c.commissionAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2"
                          sx={{ color: c.isOverdue ? '#DC2626' : KUKAT.textMuted }}>
                          {c.dueDate
                            ? new Date(c.dueDate).toLocaleDateString('en-CA')
                            : '—'}
                          {c.isOverdue && ' ⚠'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={c.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Edit drawer ──────────────────────────────────────── */}
      <Drawer anchor="right" open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Typography variant="h5" sx={{ color: KUKAT.navy }}>
            Edit supplier
          </Typography>
          <IconButton onClick={() => setEditOpen(false)} disabled={saving}>
            <Close />
          </IconButton>
        </Box>
        {saveErr && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>
            {saveErr}
          </Alert>
        )}
        <SupplierForm
          initial={s}
          onSave={handleEdit}
          onCancel={() => setEditOpen(false)}
          saving={saving}
        />
      </Drawer>

    </AppLayout>
  );
}