import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, CardHeader, Typography,
  Button, Divider, Chip, Alert, Skeleton, IconButton,
  Drawer, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, TextField, InputAdornment, MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack, Edit, Receipt, Group, Close,
  Person, AttachMoney, CheckCircle, Cancel,
  ShoppingCart, Business, Add,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import BookingForm from './BookingForm';
import { useBooking } from '../../hooks/useBookings';
import { bookingsApi } from '../../api/index';
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

export default function BookingDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit    = ['superadmin', 'manager', 'agent'].includes(user?.role);
  const canConfirm = ['superadmin', 'manager'].includes(user?.role);

  const { booking, loading, error, refetch } = useBooking(id);

  const [editOpen,      setEditOpen]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveErr,       setSaveErr]       = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Member payment drawer state
  const [memberPayDrawer, setMemberPayDrawer] = useState({ open: false, member: null });
  const [memberPayForm,   setMemberPayForm]   = useState({
    amountPaid: '', paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: '',
  });
  const [memberPaySaving, setMemberPaySaving] = useState(false);
  const [memberPayErr,    setMemberPayErr]    = useState('');

  // Add member drawer state
  const [addMemberDrawer,  setAddMemberDrawer]  = useState(false);
  const [addMemberQuery,   setAddMemberQuery]   = useState('');
  const [addMemberOptions, setAddMemberOptions] = useState([]);
  const [addMemberShare,   setAddMemberShare]   = useState('');
  const [addMemberSaving,  setAddMemberSaving]  = useState(false);
  const [addMemberErr,     setAddMemberErr]     = useState('');

  // Search customers for add member
  useEffect(() => {
    if (!addMemberQuery || addMemberQuery.length < 2) {
      setAddMemberOptions([]); return;
    }
    bookingsApi.getCustomers({ search: addMemberQuery })
      .then(({ data }) => {
        const list = data.customers ?? data.data ?? data;
        setAddMemberOptions(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [addMemberQuery]);

  const handleAction = useCallback(async (action) => {
    setActionLoading(true); setSaveErr('');
    try {
      await bookingsApi[action](id);
      refetch();
    } catch (err) {
      setSaveErr(err.response?.data?.message || `Failed to ${action} booking.`);
    } finally { setActionLoading(false); }
  }, [id, refetch]);

  const handleSave = useCallback(async (data) => {
    setSaving(true); setSaveErr('');
    try {
      await bookingsApi.update(id, data);
      setEditOpen(false);
      refetch();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to update booking.');
    } finally { setSaving(false); }
  }, [id, refetch]);

  const handleMemberPayment = useCallback(async () => {
    setMemberPaySaving(true); setMemberPayErr('');
    try {
      await bookingsApi.addMemberPayment(
        id,
        memberPayDrawer.member.customerID,
        memberPayForm
      );
      setMemberPayDrawer({ open: false, member: null });
      refetch();
    } catch (err) {
      setMemberPayErr(err.response?.data?.message || 'Failed to record payment.');
    } finally { setMemberPaySaving(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberPayForm, memberPayDrawer.member, refetch]);

  const handleAddMember = useCallback(async (customer) => {
    if (!customer) return;
    setAddMemberSaving(true); setAddMemberErr('');
    try {
      // const response = await bookingsApi.addMember(id, {
      //   customerID:  customer.customerID,
      //   shareAmount: parseFloat(addMemberShare || 0),
      // });
      setAddMemberDrawer(false);
      setAddMemberQuery('');
      setAddMemberShare('');
      refetch();
    } catch (err) {
      setAddMemberErr(err.response?.data?.message || 'Failed to add member.');
    } finally { setAddMemberSaving(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, addMemberShare, refetch]);

  if (loading) return (
    <AppLayout title="Booking detail">
      <Skeleton variant="rounded" height={300} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={200} />
    </AppLayout>
  );

  if (error) return (
    <AppLayout title="Booking detail">
      <Alert severity="error">{error}</Alert>
    </AppLayout>
  );

  const b       = booking || {};
  const items   = b.items   ?? [];
  const members = b.members ?? [];

  const itemsTotal = parseFloat(b.itemsTotal  || b.basePrice || 0);
  const taxAmount  = itemsTotal * (parseFloat(b.taxRate || 0) / 100);
  const grandTotal = itemsTotal + taxAmount;

  // ← role === 'lead' not m.isLead
  const leadMember = members.find(m => m.role === 'lead');

  return (
    <AppLayout
      title={`Booking #${b.bookingID}`}
      subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} · ${members.length} traveller${members.length !== 1 ? 's' : ''}`}>

      {/* ── Back + actions ─────────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5, mb: 3,
      }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bookings')}
          variant="outlined" size="small"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Back to bookings
        </Button>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {b.invoiceID && (
            <Button startIcon={<Receipt />} variant="outlined" size="small"
              onClick={() => navigate(`/invoices/${b.invoiceID}`)}>
              View invoice
            </Button>
          )}
          {b.status === 'pending' && canConfirm && (
            <Button variant="outlined" color="success" size="small"
              startIcon={actionLoading
                ? <CircularProgress size={14} />
                : <CheckCircle />}
              disabled={actionLoading}
              onClick={() => handleAction('confirm')}>
              Confirm
            </Button>
          )}
          {b.status === 'confirmed' && canConfirm && (
            <Button variant="outlined" color="info" size="small"
              disabled={actionLoading}
              onClick={() => handleAction('complete')}>
              {actionLoading ? <CircularProgress size={14} /> : 'Mark completed'}
            </Button>
          )}
          {['pending', 'confirmed'].includes(b.status) && canEdit && (
            <Button variant="outlined" color="error" size="small"
              startIcon={actionLoading
                ? <CircularProgress size={14} />
                : <Cancel />}
              disabled={actionLoading}
              onClick={() => handleAction('cancel')}>
              Cancel
            </Button>
          )}
          {canEdit && (
            <Button startIcon={<Edit />} variant="contained" size="small"
              onClick={() => { setSaveErr(''); setEditOpen(true); }}>
              Edit booking
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

        {/* ── Overview + sidebar ─────────────────────────────── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 2.5, alignItems: 'start',
        }}>
          <Card>
            <CardHeader
              avatar={<ShoppingCart sx={{ color: KUKAT.navy }} />}
              title={`Booking #${b.bookingID}`}
              subheader={`Created ${b.createdAt
                ? new Date(b.createdAt).toLocaleDateString('en-CA')
                : '—'}`}
              action={<StatusChip status={b.status} />}
            />
            <CardContent>
              <InfoRow label="Booking date"
                value={b.bookingDate
                  ? new Date(b.bookingDate).toLocaleDateString('en-CA')
                  : null} />
              <InfoRow label="Trip start"
                value={b.tripStart
                  ? new Date(b.tripStart).toLocaleDateString('en-CA')
                  : null} />
              <InfoRow label="Trip end"
                value={b.tripEnd
                  ? new Date(b.tripEnd).toLocaleDateString('en-CA')
                  : null} />
              <InfoRow label="Items"      value={b.itemCount ?? items.length} />
              <InfoRow label="Travellers" value={members.length} />
              <InfoRow label="Agent"      value={b.agentName} />
              {b.notes && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ color: KUKAT.navy, mt: 0.5 }}>
                    {b.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardHeader
                avatar={<Person sx={{ color: KUKAT.teal }} />}
                title="Lead customer"
                titleTypographyProps={{
                  variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy }
                }}
              />
              <CardContent sx={{ pt: 0 }}>
                {leadMember ? (
                  <>
                    <Typography fontWeight={600} sx={{ color: KUKAT.navy }}>
                      {leadMember.firstName} {leadMember.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                      {leadMember.email}
                    </Typography>
                    <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                      {leadMember.homePhone}
                    </Typography>
                    <Button size="small" variant="text" sx={{ mt: 1, px: 0 }}
                      onClick={() => navigate(`/customers/${leadMember.customerID}`)}>
                      View profile →
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                    No lead customer found.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                avatar={<AttachMoney sx={{ color: KUKAT.amber }} />}
                title="Pricing"
                titleTypographyProps={{
                  variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy }
                }}
              />
              <CardContent sx={{ pt: 0 }}>
                <InfoRow label="Items subtotal" value={fmt(itemsTotal)} />
                <InfoRow label={`Tax (${b.taxRate || 0}%)`} value={fmt(taxAmount)} />
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography fontWeight={700} sx={{ color: KUKAT.navy }}>
                    Grand total
                  </Typography>
                  <Typography fontWeight={700}
                    sx={{ color: KUKAT.navy, fontSize: '1.1rem' }}>
                    {fmt(grandTotal)}
                  </Typography>
                </Box>
                {b.invoiceID && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <InfoRow label="Invoice status" value={b.invoiceStatus} />
                    <InfoRow label="Invoice total"  value={fmt(b.invoiceTotal)} />
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* ── Booking items ──────────────────────────────────── */}
        <Card>
          <CardHeader
            avatar={<Business sx={{ color: KUKAT.amber }} />}
            title="Booking items"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
            subheader={`${items.length} product${items.length !== 1 ? 's' : ''} in this booking`}
            subheaderTypographyProps={{ variant: 'caption' }}
          />
          <CardContent sx={{ pt: 0 }}>
            {items.length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                No items found.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Trip dates</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Line total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={item.itemID}
                      sx={{ background: i % 2 === 0 ? '#fff' : KUKAT.surface }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.productName}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                            {item.description}
                          </Typography>
                        )}
                        {item.destinationName && (
                          <Typography variant="caption"
                            sx={{ color: KUKAT.teal, display: 'block' }}>
                            → {item.destinationName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {item.supplierName}
                        </Typography>
                        <Typography variant="caption"
                          sx={{ color: '#15803D', display: 'block', fontWeight: 600 }}>
                          {parseFloat(item.supplierCommissionRate || 0).toFixed(1)}% commission
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.categoryName} size="small"
                          sx={{ fontSize: '0.68rem', height: 18,
                            background: `${KUKAT.teal}15`, color: KUKAT.teal }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {item.tripStart
                            ? new Date(item.tripStart).toLocaleDateString('en-CA')
                            : '—'}
                          {' → '}
                          {item.tripEnd
                            ? new Date(item.tripEnd).toLocaleDateString('en-CA')
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {item.className || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fmt(item.unitPrice)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}
                          sx={{ color: KUKAT.navy }}>
                          {fmt(item.lineTotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ background: `${KUKAT.navy}08` }}>
                    <TableCell colSpan={7} align="right">
                      <Typography variant="body2" fontWeight={700} sx={{ color: KUKAT.navy }}>
                        Items subtotal
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} sx={{ color: KUKAT.navy }}>
                        {fmt(itemsTotal)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ── Travellers ─────────────────────────────────────── */}
        <Card>
          <CardHeader
            avatar={<Group sx={{ color: KUKAT.teal }} />}
            title="Travellers"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
            subheader={`${members.length} traveller${members.length !== 1 ? 's' : ''} on this booking`}
            subheaderTypographyProps={{ variant: 'caption' }}
            // ← Add traveller button
            action={
              canEdit && ['pending', 'confirmed'].includes(b.status) && (
                <Button size="small" variant="outlined" startIcon={<Add />}
                  onClick={() => { setAddMemberErr(''); setAddMemberDrawer(true); }}>
                  Add traveller
                </Button>
              )
            }
          />
          <CardContent sx={{ pt: 0 }}>
            {members.length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                No travellers found.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Share</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m, i) => {
                    const remaining = parseFloat(m.shareAmount || 0)
                      - parseFloat(m.sharePaid || 0);
                    return (
                      <TableRow key={m.customerID}
                        sx={{ background: i % 2 === 0 ? '#fff' : KUKAT.surface }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {m.firstName} {m.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                            {m.email || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {/* ← role string not isLead boolean */}
                          <Chip
                            label={m.role === 'lead' ? 'Lead' : 'Member'}
                            size="small"
                            sx={{
                              fontSize: '0.7rem', height: 18,
                              background: m.role === 'lead' ? '#FEF9C3' : '#F1F5F9',
                              color:      m.role === 'lead' ? '#854D0E' : '#475569',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{fmt(m.shareAmount)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}
                            sx={{ color: '#15803D' }}>
                            {fmt(m.sharePaid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}
                            sx={{ color: remaining > 0 ? '#DC2626' : '#15803D' }}>
                            {fmt(remaining)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={m.shareStatus} />
                        </TableCell>
                        <TableCell>
                          {/* ← role !== 'lead' not !m.isLead */}
                          {remaining > 0 && m.role !== 'lead' && (
                            <Button size="small" variant="outlined"
                              onClick={() => {
                                setMemberPayErr('');
                                setMemberPayForm({
                                  amountPaid:    remaining.toFixed(2),
                                  paymentMethod: 'CASH',
                                  paymentDate:   new Date().toISOString().slice(0, 10),
                                  reference:     '',
                                });
                                setMemberPayDrawer({ open: true, member: m });
                              }}>
                              Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </Box>

      {/* ── Edit drawer ──────────────────────────────────────── */}
      <Drawer anchor="right" open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 720 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              Edit booking #{b.bookingID}
            </Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Update items, travellers and pricing below
            </Typography>
          </Box>
          <IconButton onClick={() => setEditOpen(false)} disabled={saving}>
            <Close />
          </IconButton>
        </Box>
        {saveErr && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>
            {saveErr}
          </Alert>
        )}
        <BookingForm
          initial={b}
          onSave={handleSave}
          onCancel={() => setEditOpen(false)}
          saving={saving}
        />
      </Drawer>

      {/* ── Member payment drawer ─────────────────────────────── */}
      <Drawer anchor="right" open={memberPayDrawer.open}
        onClose={() => !memberPaySaving && setMemberPayDrawer({ open: false, member: null })}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              Record member payment
            </Typography>
            {memberPayDrawer.member && (
              <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                {memberPayDrawer.member.firstName} {memberPayDrawer.member.lastName}
                {' · Balance: '}
                {fmt(
                  parseFloat(memberPayDrawer.member.shareAmount || 0)
                  - parseFloat(memberPayDrawer.member.sharePaid  || 0)
                )}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => setMemberPayDrawer({ open: false, member: null })}
            disabled={memberPaySaving}>
            <Close />
          </IconButton>
        </Box>

        {memberPayErr && (
          <Alert severity="error" sx={{ mb: 2 }}>{memberPayErr}</Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}>
            <TextField fullWidth label="Amount *" type="number"
              value={memberPayForm.amountPaid}
              onChange={(e) => setMemberPayForm(p => ({ ...p, amountPaid: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }} />
            <TextField select fullWidth label="Method *"
              value={memberPayForm.paymentMethod}
              onChange={(e) => setMemberPayForm(p => ({ ...p, paymentMethod: e.target.value }))}>
              {['CASH', 'CARD', 'TRANSFER', 'CHECK'].map(m =>
                <MenuItem key={m} value={m}>{m}</MenuItem>
              )}
            </TextField>
            <TextField fullWidth label="Payment date" type="date"
              value={memberPayForm.paymentDate}
              onChange={(e) => setMemberPayForm(p => ({ ...p, paymentDate: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Reference"
              value={memberPayForm.reference}
              onChange={(e) => setMemberPayForm(p => ({ ...p, reference: e.target.value }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
            <Button variant="outlined"
              onClick={() => setMemberPayDrawer({ open: false, member: null })}
              disabled={memberPaySaving}>
              Cancel
            </Button>
            <Button variant="contained"
              disabled={memberPaySaving || !memberPayForm.amountPaid}
              onClick={handleMemberPayment}>
              {memberPaySaving
                ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                : 'Record payment'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* ── Add member drawer ─────────────────────────────────── */}
      <Drawer anchor="right" open={addMemberDrawer}
        onClose={() => !addMemberSaving && setAddMemberDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', mb: 3,
        }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>
              Add traveller
            </Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
              Search and add a traveller to booking #{b.bookingID}
            </Typography>
          </Box>
          <IconButton onClick={() => setAddMemberDrawer(false)} disabled={addMemberSaving}>
            <Close />
          </IconButton>
        </Box>

        {addMemberErr && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddMemberErr('')}>
            {addMemberErr}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={addMemberOptions}
            getOptionLabel={(o) =>
              `${o.firstName} ${o.lastName}${o.email ? ` — ${o.email}` : ''}`
            }
            inputValue={addMemberQuery}
            onInputChange={(_, v) => setAddMemberQuery(v)}
            onChange={(_, v) => { if (v) handleAddMember(v); }}
            value={null}
            loading={false}
            renderInput={(params) => (
              <TextField {...params} label="Search customer by name or email"
                helperText="Type at least 2 characters to search" />
            )}
          />

          <TextField fullWidth label="Share amount ($)" type="number"
            value={addMemberShare}
            onChange={(e) => setAddMemberShare(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            helperText="How much of the total this traveller owes"
          />

          <Box sx={{
            p: 1.5, borderRadius: 1,
            background: '#F0F9FF', border: '1px solid #BAE6FD',
          }}>
            <Typography variant="caption" sx={{ color: '#0369A1' }}>
              Select a customer from the search above to add them as a traveller.
              They will be added immediately upon selection.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
            <Button variant="outlined"
              onClick={() => setAddMemberDrawer(false)}
              disabled={addMemberSaving}>
              Close
            </Button>
          </Box>
        </Box>
      </Drawer>

    </AppLayout>
  );
}