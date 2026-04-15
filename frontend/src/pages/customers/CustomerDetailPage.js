import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography, Button,
  Alert, Skeleton, Drawer, IconButton, Divider, Avatar,
  Table, TableHead, TableRow, TableCell, TableBody, Chip,
  MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, Edit, SwapHoriz, CreditCard, Close } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import CustomerForm from './CustomerForm';
import { useCustomer } from '../../hooks/useModules';
import { customersApi, staffApi } from '../../api/index';
import { useAuth } from '../../store/AuthContext';

import { KUKAT } from '../../styles/theme';

const InfoRow = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1,
      borderBottom: `1px solid ${KUKAT.border}`, '&:last-child': { borderBottom: 'none' } }}>
      <Typography variant="body2" sx={{ color: KUKAT.textMuted, fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: KUKAT.navy, fontWeight: 600 }}>{value ?? '—'}</Typography>
    </Box>
  );
}

export default function CustomerDetailPage() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const { isHR, isAdmin, isManager } = useAuth();
  const { customer, loading, error, refetch } = useCustomer(id);

  const [editOpen,     setEditOpen]     = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [agents,       setAgents]       = useState([]);
  const [newAgent,     setNewAgent]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [saveErr,      setSaveErr]      = useState('');

  useEffect(() => {
    if (reassignOpen) {
      staffApi.getAll({ role: 'agent' }).then(({ data }) => {
        const list = data.employees ?? data.data ?? data;
        setAgents(Array.isArray(list) ? list : []);
      }).catch(() => {});
    }
  }, [reassignOpen]);

  const handleEdit = useCallback(async (data) => {
    setSaving(true); setSaveErr('');
    try { await customersApi.update(id, data); setEditOpen(false); refetch(); }
    catch (err) { setSaveErr(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  }, [id, refetch]);

  const handleReassign = useCallback(async () => {
    if (!newAgent) return;
    setSaving(true); setSaveErr('');
    try { await customersApi.reassign(id, newAgent); setReassignOpen(false); refetch(); }
    catch (err) { setSaveErr(err.response?.data?.message || 'Reassign failed.'); }
    finally { setSaving(false); }
  }, [id, newAgent, refetch]);

  if (loading) return <AppLayout title="Customer"><Skeleton variant="rounded" height={400} /></AppLayout>;
  if (error)   return <AppLayout title="Customer"><Alert severity="error">{error}</Alert></AppLayout>;

  const c = customer || {};

  return (
    <AppLayout title={`${c.firstName} ${c.lastName}`} subtitle={c.email}>

      {/* ── Back + actions ─────────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5, mb: 3,
      }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/customers')}
          variant="outlined" size="small"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {(isHR() || isAdmin() || isManager()) && (
            <Button startIcon={<SwapHoriz />} variant="outlined" size="small"
              onClick={() => setReassignOpen(true)}>
              Reassign agent
            </Button>
          )}
          <Button startIcon={<Edit />} variant="contained" size="small"
            onClick={() => { setSaveErr(''); setEditOpen(true); }}>
            Edit
          </Button>
        </Box>
      </Box>

      {saveErr && <Alert severity="error" sx={{ mb: 2 }}>{saveErr}</Alert>}

      {/* ── Main layout ────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
        gap: 2.5,
        alignItems: 'start',
      }}>

        {/* ── Left column: Profile + Address ─────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <Card>
            <CardContent sx={{ textAlign: 'center', pt: 3 }}>
              <Avatar sx={{
                width: 64, height: 64, fontSize: '1.4rem', fontWeight: 700,
                background: `linear-gradient(135deg, ${KUKAT.amber}, ${KUKAT.amberDark})`,
                color: KUKAT.navy, mx: 'auto', mb: 1.5,
              }}>
                {c.firstName?.[0]}{c.lastName?.[0]}
              </Avatar>
              <Typography variant="h6" sx={{ color: KUKAT.navy }}>
                {c.firstName} {c.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 2 }}>
                {c.email}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InfoRow label="Home phone"    value={c.homePhone} />
              <InfoRow label="Business ph."  value={c.businessPhone} />
              <InfoRow label="Date of birth"
                value={c.birthDate
                  ? new Date(c.birthDate).toLocaleDateString('en-CA')
                  : null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Address"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '0.95rem' } }} />
            <CardContent sx={{ pt: 0 }}>
              <InfoRow label="Street"   value={c.address} />
              <InfoRow label="City"     value={c.city} />
              <InfoRow label="Province" value={c.province} />
              <InfoRow label="Postal"   value={c.postalCode} />
              <InfoRow label="Country"  value={c.country} />
            </CardContent>
          </Card>

        </Box>

        {/* ── Right column: Bookings + Cards ─────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <Card>
            <CardHeader title="Booking history"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
              action={
                <Button size="small" onClick={() => navigate(`/bookings?customer=${id}`)}>
                  View all
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {c.bookings?.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Trip start</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {c.bookings.slice(0, 6).map((b) => (
                      <TableRow key={b.bookingID} sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/bookings/${b.bookingID}`)}>
                        <TableCell>#{b.bookingID}</TableCell>
                        <TableCell>{b.productName}</TableCell>
                        <TableCell>
                          {b.tripStart
                            ? new Date(b.tripStart).toLocaleDateString('en-CA')
                            : '—'}
                        </TableCell>
                        <TableCell align="right">
                          ${parseFloat(b.basePrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell><StatusChip status={b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2"
                  sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                  No bookings yet.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Payment cards"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
              avatar={<CreditCard sx={{ color: KUKAT.teal }} />}
            />
            <CardContent sx={{ pt: 0 }}>
              {c.cards?.length > 0 ? c.cards.map((card) => (
                <Box key={card.cardID} sx={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', py: 1.5,
                  borderBottom: `1px solid ${KUKAT.border}`,
                  '&:last-child': { borderBottom: 'none' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 36, height: 24, borderRadius: '4px',
                      background: KUKAT.surface,
                      border: `1px solid ${KUKAT.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: KUKAT.navy }}>
                        {card.cardType}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{card.cardNumber}</Typography>
                      <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                        {card.cardHolderName}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    Exp. {card.expiryDate
                      ? new Date(card.expiryDate).toLocaleDateString('en-CA',
                          { month: '2-digit', year: '2-digit' })
                      : '—'}
                  </Typography>
                </Box>
              )) : (
                <Typography variant="body2"
                  sx={{ color: KUKAT.textMuted, py: 2, textAlign: 'center' }}>
                  No cards on file.
                </Typography>
              )}
            </CardContent>
          </Card>

        </Box>
      </Box>

      {/* ── Edit drawer ────────────────────────────────────── */}
      <Drawer anchor="right" open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflow: 'auto' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ color: KUKAT.navy }}>Edit customer</Typography>
          <IconButton onClick={() => setEditOpen(false)} disabled={saving}><Close /></IconButton>
        </Box>
        <CustomerForm initial={c} onSave={handleEdit}
          onCancel={() => setEditOpen(false)} saving={saving} />
      </Drawer>

      {/* ── Reassign dialog ────────────────────────────────── */}
      <Dialog open={reassignOpen} onClose={() => setReassignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reassign agent</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 2 }}>
            Currently assigned to: <strong>{c.agentFirstName} {c.agentLastName}</strong>
          </Typography>
          <TextField select fullWidth label="New agent"
            value={newAgent} onChange={(e) => setNewAgent(e.target.value)}>
            {agents.map((a) => (
              <MenuItem key={a.employeeID} value={a.employeeID}>
                {a.firstName} {a.lastName} ({a.agentCode})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReassignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReassign}
            disabled={!newAgent || saving}>
            {saving ? 'Saving…' : 'Reassign'}
          </Button>
        </DialogActions>
      </Dialog>

    </AppLayout>  );
}
