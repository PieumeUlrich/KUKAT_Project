import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography,
  Button, Divider, Chip, Alert, Skeleton, IconButton,
  Drawer, Table, TableHead, TableRow, TableCell, TableBody,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack, Edit, Receipt, Group, Close,
  Person, Flight, AttachMoney,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import BookingForm from './BookingForm';
import { useBooking } from '../../hooks/useBookings';
import bookingsApi from '../../api/bookingsApi';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

// ── Info row inside a detail card ─────────────────────────────
function InfoRow({ label, value, mono }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2,
      borderBottom: `1px solid ${KUKAT.border}`, '&:last-child': { borderBottom: 'none' } }}>
      <Typography variant="body2" sx={{ color: KUKAT.textMuted, fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: KUKAT.navy, fontWeight: 600,
        fontFamily: mono ? '"DM Mono", monospace' : 'inherit' }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export default function BookingDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { canApprove } = useAuth();

  const { booking, loading, error, refetch } = useBooking(id);
  const [editOpen, setEditOpen] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');

  const handleSave = useCallback(async (data) => {
    setSaving(true);
    setSaveErr('');
    try {
      await bookingsApi.update(id, data);
      setEditOpen(false);
      refetch();
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Failed to update booking.');
    } finally {
      setSaving(false);
    }
  }, [id, refetch]);

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

  const b = booking || {};
  const totalPrice = b.basePrice
    ? (parseFloat(b.basePrice) * (1 + parseFloat(b.taxRate || 5) / 100)).toFixed(2)
    : null;

  return (
    <AppLayout
      title={`Booking #${b.bookingID}`}
      subtitle={b.productName || ''}
    >
      {/* ── Back + actions ─────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bookings')}
          variant="outlined" size="small">
          Back to bookings
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {b.invoiceID && (
            <Button startIcon={<Receipt />} variant="outlined" size="small"
              onClick={() => navigate(`/invoices/${b.invoiceID}`)}>
              View invoice
            </Button>
          )}
          <Button startIcon={<Edit />} variant="contained" size="small"
            onClick={() => { setSaveErr(''); setEditOpen(true); }}>
            Edit booking
          </Button>
        </Box>
      </Box>

      {saveErr && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>{saveErr}</Alert>}

      <Grid container spacing={2.5}>

        {/* ── Booking overview card ─────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: '10px',
                    background: `${KUKAT.navy}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Flight sx={{ color: KUKAT.navy, fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: KUKAT.navy, lineHeight: 1 }}>
                      {b.productName || '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                      {b.destinationName || 'No destination'}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <StatusChip status={b.status} />
                    {b.isGroupBooking && (
                      <Chip icon={<Group sx={{ fontSize: '14px !important' }} />}
                        label={b.groupName || 'Group'}
                        size="small"
                        sx={{ ml: 1, background: '#CCFBF1', color: '#0F766E', fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              <InfoRow label="Booking date"
                value={b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Trip start"
                value={b.tripStart ? new Date(b.tripStart).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Trip end"
                value={b.tripEnd ? new Date(b.tripEnd).toLocaleDateString('en-CA') : null} />
              <InfoRow label="Class"          value={b.classDescription} />
              <InfoRow label="Travellers"     value={b.numberOfTravellers} />
              <InfoRow label="Description"    value={b.description} />
              {b.feeName && (
                <InfoRow label="Booking fee" value={`${b.feeName} — $${b.feeAmount}`} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Sidebar cards ─────────────────────────────────── */}
        <Grid item xs={12} md={4}>

          {/* Customer card */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<Person sx={{ color: KUKAT.teal }} />}
              title="Lead customer"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy } }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography fontWeight={600} sx={{ color: KUKAT.navy }}>
                {b.customerFirstName} {b.customerLastName}
              </Typography>
              <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>{b.customerEmail}</Typography>
              <Button size="small" variant="text"
                onClick={() => navigate(`/customers/${b.customerID}`)}
                sx={{ mt: 1, px: 0 }}>
                View profile →
              </Button>
            </CardContent>
          </Card>

          {/* Pricing card */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              avatar={<AttachMoney sx={{ color: KUKAT.amber }} />}
              title="Pricing"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy } }}
            />
            <CardContent sx={{ pt: 0 }}>
              <InfoRow label="Base price"
                value={b.basePrice ? `$${parseFloat(b.basePrice).toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : null} />
              <InfoRow label="Tax rate"     value={`${b.taxRate || 5}%`} />
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={700} sx={{ color: KUKAT.navy }}>Total</Typography>
                <Typography fontWeight={700} sx={{ color: KUKAT.navy }}>
                  {totalPrice ? `$${parseFloat(totalPrice).toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : '—'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Agent card */}
          <Card>
            <CardHeader
              avatar={<Person sx={{ color: KUKAT.navy }} />}
              title="Assigned agent"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: '0.95rem', color: KUKAT.navy } }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography fontWeight={600} sx={{ color: KUKAT.navy }}>
                {b.agentFirstName} {b.agentLastName}
              </Typography>
              <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                {b.agentCode && `Code: ${b.agentCode}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Group members ─────────────────────────────────── */}
        {b.isGroupBooking && b.members?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<Group sx={{ color: KUKAT.teal }} />}
                title={`Group members — ${b.groupName}`}
                titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Share</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {b.members.map((m) => (
                      <TableRow key={m.customerID}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {m.firstName} {m.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell>{m.email || '—'}</TableCell>
                        <TableCell>
                          <Chip label={m.role} size="small"
                            sx={{ textTransform: 'capitalize', fontSize: '0.7rem',
                              backgroundColor: m.role === 'lead' ? '#FEF9C3' : '#F1F5F9',
                              color: m.role === 'lead' ? '#854D0E' : '#475569',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          ${parseFloat(m.shareAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          ${parseFloat(m.sharePaid || 0).toFixed(2)}
                        </TableCell>
                        <TableCell><StatusChip status={m.shareStatus} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ── Edit drawer ──────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 680 }, p: 3, overflow: 'auto' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: KUKAT.navy }}>Edit booking #{b.bookingID}</Typography>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>Update the fields below</Typography>
          </Box>
          <IconButton onClick={() => setEditOpen(false)} disabled={saving}><Close /></IconButton>
        </Box>

        {saveErr && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveErr('')}>{saveErr}</Alert>
        )}

        <BookingForm
          initial={b}
          onSave={handleSave}
          onCancel={() => setEditOpen(false)}
          saving={saving}
        />
      </Drawer>
    </AppLayout>
  );
}
