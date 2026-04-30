import React, { useState } from 'react';
import {
  Box, Card, CardContent, CardHeader, Typography,
  TextField, MenuItem, Button, Alert, Skeleton,
  Table, TableHead, TableRow, TableCell, TableBody, Avatar, LinearProgress,
} from '@mui/material';
import { Refresh, TrendingUp, BarChart } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import { useReports } from '../../hooks/useModules';
import { KUKAT } from '../../styles/theme';

const PERIODS = [
  { label: 'This month',    value: 'month' },
  { label: 'Last 3 months', value: 'quarter' },
  { label: 'This year',     value: 'year' },
  { label: 'All time',      value: 'all' },
];

function KPICard({ label, value, sub, color, loading }) {
  return (
    <Card>
      <CardContent sx={{ p: '20px !important' }}>
        {loading ? <Skeleton width="60%" height={36} /> : (
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: color || KUKAT.navy, lineHeight: 1 }}>
            {value}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: KUKAT.navy, fontWeight: 600, mt: 0.5 }}>{label}</Typography>
        {sub && <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const { report, loading, error, refetch } = useReports({ period });

  const rev       = report?.revenue      || {};
  const bk        = report?.bookings     || {};
  const comm      = report?.commissions  || {};
  const agents    = report?.agents       || [];
  const products  = report?.destinations || [];

  const maxBookings = Math.max(...agents.map(a => a.bookingCount || 0), 1);

  return (
    <AppLayout title="Reports & analytics" subtitle="Agency performance overview">

      {/* ── Controls ─────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <TextField select size="small" label="Period" value={period}
          onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 160 }}>
          {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
        </TextField>
        <Button startIcon={<Refresh />} onClick={refetch} variant="outlined" size="small">
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <KPICard label="Total revenue" loading={loading} color={KUKAT.teal}
          value={rev.total != null
            ? `$${parseFloat(rev.total).toLocaleString('en-CA', { minimumFractionDigits: 0 })}`
            : '—'}
          sub="From paid invoices" />
        <KPICard label="Total bookings" loading={loading} color={KUKAT.navy}
          value={bk.total ?? '—'}
          sub={`${bk.confirmed ?? 0} confirmed`} />
        <KPICard label="Commission income received" loading={loading} color="#15803D"
          value={comm.paid != null
            ? `$${parseFloat(comm.paid).toLocaleString('en-CA', { minimumFractionDigits: 0 })}`
            : '—'}
          sub={`${comm.pendingCount ?? 0} pending approval`} />
        <KPICard label="Avg booking value" loading={loading} color={KUKAT.amber}
          value={rev.avgBooking != null
            ? `$${parseFloat(rev.avgBooking).toFixed(0)}`
            : '—'}
          sub="Base price average" />
      </Box>

      {/* ── Agent performance + Top products ─────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2.5,
        mb: 2.5,
        alignItems: 'start',
      }}>

        {/* Agent performance */}
        <Card>
          <CardHeader title="Agent performance"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
            avatar={<BarChart sx={{ color: KUKAT.teal }} />}
          />
          <CardContent sx={{ pt: 0 }}>
            {loading ? <Skeleton variant="rounded" height={200} /> :
            agents.length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                No data.
              </Typography>
            ) : agents.map((a) => (
              <Box key={a.employeeID} sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.8 }}>
                  <Avatar sx={{
                    width: 28, height: 28, fontSize: '0.72rem', fontWeight: 700,
                    background: KUKAT.navy, color: '#fff',
                  }}>
                    {a.firstName?.[0]}{a.lastName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {a.firstName} {a.lastName}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.teal }}>
                        {a.bookingCount} bookings
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate"
                      value={(a.bookingCount / maxBookings) * 100}
                      sx={{ mt: 0.5, height: 5, borderRadius: 3,
                        '& .MuiLinearProgress-bar': { backgroundColor: KUKAT.teal } }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, pl: 4.5 }}>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    Revenue: <strong style={{ color: KUKAT.navy }}>
                      ${parseFloat(a.revenue || 0).toLocaleString('en-CA', { minimumFractionDigits: 0 })}
                    </strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    Commission: <strong style={{ color: '#15803D' }}>
                      ${parseFloat(a.commission || 0).toFixed(0)}
                    </strong>
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader title="Top products"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }}
            avatar={<TrendingUp sx={{ color: KUKAT.amber }} />}
          />
          <CardContent sx={{ pt: 0 }}>
            {loading ? <Skeleton variant="rounded" height={200} /> :
            products.length === 0 ? (
              <Typography variant="body2"
                sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                No data.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Bookings</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.slice(0, 8).map((p, i) => (
                    <TableRow key={p.productID}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700,
                            color: KUKAT.textMuted, width: 18, textAlign: 'center' }}>
                            #{i + 1}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>{p.productName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                          {p.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>{p.bookingCount}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.teal }}>
                          ${parseFloat(p.revenue || 0).toLocaleString('en-CA', { minimumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Booking status breakdown — full width ─────────────── */}
      <Card>
        <CardHeader title="Booking status breakdown"
          titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy } }} />
        <CardContent sx={{ pt: 0 }}>
          {loading ? <Skeleton variant="rounded" height={60} /> : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}>
              {[
                { label: 'Confirmed', value: bk.confirmed ?? 0, color: '#15803D', bg: '#DCFCE7' },
                { label: 'Pending',   value: bk.pending   ?? 0, color: '#854D0E', bg: '#FEF9C3' },
                { label: 'Completed', value: bk.completed ?? 0, color: '#0369A1', bg: '#E0F2FE' },
                { label: 'Cancelled', value: bk.cancelled ?? 0, color: '#DC2626', bg: '#FEE2E2' },
              ].map(s => (
                <Box key={s.label} sx={{
                  p: 2, borderRadius: 2,
                  background: s.bg, textAlign: 'center',
                }}>
                  <Typography sx={{
                    fontSize: '1.6rem', fontWeight: 700,
                    color: s.color, lineHeight: 1,
                  }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: s.color, fontWeight: 500 }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

    </AppLayout>
  );
}
