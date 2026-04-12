import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableHead, TableRow, TableCell, TableBody,
  Skeleton, Alert, Chip, Avatar,
} from '@mui/material';
import {
  BookOnline, People, Receipt, AccountBalance,
  TrendingUp, CheckCircle, HourglassEmpty, AttachMoney,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import { useAuth } from '../../store/AuthContext';
import { useDashboard } from '../../hooks/useModules';
import { KUKAT } from '../../styles/theme';

function KPICard({ label, value, icon, color, sub, loading }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '20px !important' }}>
        <Box sx={{
          width: 50, height: 50, borderRadius: '13px', flexShrink: 0,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading
            ? <Skeleton width={60} height={32} />
            : <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1 }}>
                {value}
              </Typography>
          }
          <Typography variant="caption" sx={{ color: KUKAT.textMuted, display: 'block' }}>
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: KUKAT.textMuted, fontSize: '0.7rem' }}>
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

const fmt = (n) =>
  n != null
    ? `$${parseFloat(n).toLocaleString('en-CA', { minimumFractionDigits: 0 })}`
    : '—';

export default function DashboardPage() {
  const navigate                 = useNavigate();
  const { user }                 = useAuth();
  const { data, loading, error } = useDashboard();

  console.log('Dashboard data:', data);
  
  const bk   = data?.bookings    || {};
  const inv  = data?.invoices    || {};
  const comm = data?.commissions || {};
  const cust = data?.customers   || {};

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Good day, ${user?.firstName} — here's your overview`}
    >
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Bookings KPIs */}
      <Typography variant="h6" sx={{ color: KUKAT.navy, mb: 1.5 }}>Bookings</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPICard label="Total bookings" value={bk.total ?? '—'}
            icon={<BookOnline />} color={KUKAT.navy}
            sub={`${bk.thisMonth ?? 0} this month`} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Confirmed" value={bk.confirmed ?? '—'}
            icon={<CheckCircle />} color="#15803D" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Pending" value={bk.pending ?? '—'}
            icon={<HourglassEmpty />} color={KUKAT.amber} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Total revenue" value={fmt(bk.totalRevenue)}
            icon={<TrendingUp />} color={KUKAT.teal} loading={loading} />
        </Grid>
      </Grid>

      {/* Finance KPIs */}
      <Typography variant="h6" sx={{ color: KUKAT.navy, mb: 1.5 }}>Finance</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPICard label="Total invoices" value={inv.total ?? '—'}
            icon={<Receipt />} color={KUKAT.navy}
            sub={`${inv.unpaid ?? 0} unpaid`} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Collected" value={fmt(inv.totalCollected)}
            icon={<AttachMoney />} color="#15803D" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Outstanding" value={fmt(inv.totalOutstanding)}
            icon={<Receipt />} color="#DC2626" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Customers" value={cust.total ?? '—'}
            icon={<People />} color={KUKAT.teal}
            sub={`${cust.newThisMonth ?? 0} new this month`} loading={loading} />
        </Grid>
      </Grid>

      {/* Commission KPIs */}
      <Typography variant="h6" sx={{ color: KUKAT.navy, mb: 1.5 }}>Commissions</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <KPICard label="Total commissions" value={comm.total ?? '—'}
            icon={<AccountBalance />} color="#7C3AED" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Pending approval" value={comm.pending ?? '—'}
            icon={<HourglassEmpty />} color={KUKAT.amber} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Total paid out" value={fmt(comm.totalPaid)}
            icon={<AttachMoney />} color="#15803D" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard label="Pending amount" value={fmt(comm.totalPending)}
            icon={<AccountBalance />} color="#DC2626" loading={loading} />
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={2.5}>

        {/* Recent bookings */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader
              title="Recent bookings"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
              action={
                <Typography variant="body2" onClick={() => navigate('/bookings')}
                  sx={{ color: KUKAT.teal, cursor: 'pointer', mt: 0.5,
                    '&:hover': { textDecoration: 'underline' } }}>
                  View all →
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={200} /> :
               (data?.recentBookings ?? []).length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                  No bookings yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.recentBookings ?? []).map((b) => (
                      <TableRow key={b.bookingID} sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/bookings/${b.bookingID}`)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{b.customerName}</Typography>
                          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{b.agentName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{b.productName}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>{fmt(b.basePrice)}</Typography>
                        </TableCell>
                        <TableCell><StatusChip status={b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending commissions */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              title="Pending commissions"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
              action={
                <Typography variant="body2" onClick={() => navigate('/commissions')}
                  sx={{ color: KUKAT.teal, cursor: 'pointer', mt: 0.5,
                    '&:hover': { textDecoration: 'underline' } }}>
                  View all →
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={200} /> :
               (data?.pendingCommissions ?? []).length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                  No pending commissions.
                </Typography>
              ) : (
                (data?.pendingCommissions ?? []).map((c) => (
                  <Box key={c.commissionID} onClick={() => navigate('/commissions')} sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    py: 1.5, cursor: 'pointer',
                    borderBottom: `1px solid ${KUKAT.border}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{
                        width: 32, height: 32, fontSize: '0.72rem', fontWeight: 700,
                        background: `${KUKAT.navy}15`, color: KUKAT.navy,
                      }}>
                        {c.agentName?.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{c.agentName}</Typography>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {c.agentCode} · #{c.commissionID}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: KUKAT.navy }}>
                        {fmt(c.commissionAmount)}
                      </Typography>
                      <StatusChip status="pending" />
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent payments */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Recent payments"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
              action={
                <Typography variant="body2" onClick={() => navigate('/invoices')}
                  sx={{ color: KUKAT.teal, cursor: 'pointer', mt: 0.5,
                    '&:hover': { textDecoration: 'underline' } }}>
                  View all →
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={120} /> :
               (data?.recentPayments ?? []).length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                  No payments yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.recentPayments ?? []).map((p) => (
                      <TableRow key={p.paymentID} sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/invoices/${p.invoiceID}`)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{p.customerName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={p.paymentMethod} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, borderRadius: '4px',
                              background: `${KUKAT.navy}10`, color: KUKAT.navy }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
                            {p.paymentDate
                              ? new Date(p.paymentDate).toLocaleDateString('en-CA')
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#15803D' }}>
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
    </AppLayout>
  );
}