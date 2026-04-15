import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardHeader,
  Table, TableHead, TableRow, TableCell, TableBody,
  Skeleton, Alert, Chip, Avatar, ToggleButton, ToggleButtonGroup,
  LinearProgress, Divider,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, BookOnline, People,
  Receipt, AccountBalance, AttachMoney, CheckCircle,
  HourglassEmpty, FlightTakeoff,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import StatusChip from '../../components/common/StatusChip';
import { useAuth } from '../../store/AuthContext';
import { useDashboard, useReports } from '../../hooks/useModules';
import { KUKAT } from '../../styles/theme';

// ── Constants ──────────────────────────────────────────────────
const PERIODS = [
  { value: 'month',   label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' },
  { value: 'year',    label: 'Last 12 months' },
  { value: 'all',     label: 'All time' },
];

const CHART_COLORS = {
  primary:   KUKAT.navy,
  secondary: KUKAT.teal,
  amber:     '#F59E0B',
  purple:    '#7C3AED',
  green:     '#15803D',
  red:       '#DC2626',
  lightBlue: '#38BDF8',
};

const PIE_COLORS = ['#0B2B40', '#0D9488', '#F59E0B', '#DC2626', '#7C3AED'];

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n) =>
  n != null ? `$${parseFloat(n).toLocaleString('en-CA', { minimumFractionDigits: 0 })}` : '—';

const fmtK = (n) => {
  if (n == null) return '—';
  const v = parseFloat(n);
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};

const fmtShort = (n) => {
  if (n == null) return '—';
  const v = parseFloat(n);
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000)    return `${(v / 1000).toFixed(1)}K`;
  return `${v.toFixed(0)}`;
};

// ── Custom tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isCurrency = true }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: '#fff', border: `1px solid ${KUKAT.border}`,
      borderRadius: '8px', p: 1.5,
      boxShadow: '0 4px 12px rgba(11,43,64,0.12)',
    }}>
      {label && (
        <Typography variant="caption" sx={{ color: KUKAT.textMuted, display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map((entry, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={600} sx={{ color: KUKAT.navy }}>
            {entry.name}: {isCurrency
              ? `$${parseFloat(entry.value).toLocaleString('en-CA', { minimumFractionDigits: 0 })}`
              : entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ── Admin Dashboard Component ───────────────────────────
const AdminDashboard = ({ bk, inv, comm, cust, trend, agents, destinations, statusPie, agentBarData, loading, rLoading, navigate, maxDest, recentBookings, recentPayments }) => {
  const convRate = (a) => a.bookingCount > 0 ? Math.round((a.bookingCount / (a.bookingCount + (a.lostCount || 0))) * 100) : 0;

  return (
    <>
      {/* ── ROW 1: 4 top stat cards ────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <TopStatCard label="Total bookings" value={fmtShort(bk.total)}
          icon={<BookOnline />} color={KUKAT.navy}
          trendValue={bk.thisMonth > 0 ? 12 : -5} loading={loading} />
        <TopStatCard label="Revenue" value={fmtK(bk.totalRevenue)}
          icon={<TrendingUp />} color={KUKAT.teal}
          trendValue={16} loading={loading} />
        <TopStatCard label="Customers" value={fmtShort(cust.total)}
          icon={<People />} color={CHART_COLORS.amber}
          trendValue={cust.newThisMonth > 0 ? 8 : -3} loading={loading} />
        <TopStatCard label="Commissions" value={fmtK(comm.totalPaid)}
          icon={<AccountBalance />} color={CHART_COLORS.purple}
          trendValue={-10} loading={loading} />
      </Box>
      
      {/* ── ROW 2: 3 mini chart cards ──────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <MiniChartCard title="Total revenue"
          value={fmtK(inv.totalCollected)}
          sub={`${inv.unpaid ?? 0} unpaid invoices`}
          icon={<AttachMoney />}
          data={trend} dataKey="revenue"
          color={KUKAT.teal} chartType="area" loading={rLoading} />
        <MiniChartCard title="Bookings trend"
          value={fmtShort(bk.total)}
          sub={`${bk.confirmed ?? 0} confirmed`}
          icon={<BookOnline />}
          data={trend} dataKey="bookings"
          color={KUKAT.navy} chartType="area" loading={rLoading} />
        <MiniChartCard title="Monthly bookings"
          value={fmtShort(bk.thisMonth)}
          sub="This period"
          icon={<Receipt />}
          data={trend.slice(-6)} dataKey="bookings"
          color={CHART_COLORS.amber} chartType="bar" loading={rLoading} />
      </Box>
      
      {/* ── ROW 3: Revenue chart + top destinations ────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '8fr 4fr' },
        gap: 2,
        mb: 3,
      }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Revenue overview"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
            />
            <CardContent sx={{ pt: 0 }}>
              {rLoading ? <Skeleton variant="rounded" height={260} /> :
               trend.length === 0 ? (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No data for this period.</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${KUKAT.border}`} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                        tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                        tickLine={false} axisLine={false} tickFormatter={fmtK} width={55} />
                      <Tooltip content={<CustomTooltip isCurrency />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="revenue" name="Revenue"
                        stroke={KUKAT.teal} strokeWidth={2.5}
                        dot={{ fill: KUKAT.teal, r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="collected" name="Collected"
                        stroke={KUKAT.navy} strokeWidth={2.5} strokeDasharray="5 3"
                        dot={{ fill: KUKAT.navy, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Top destinations"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
            />
            <CardContent sx={{ pt: 0 }}>
              {rLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton width="60%" height={14} sx={{ mb: 0.5 }} />
                    <Skeleton variant="rounded" height={8} />
                  </Box>
                ))
              ) : destinations.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No data.</Typography>
                </Box>
              ) : (
                destinations.slice(0, 7).map((d, i) => (
                  <Box key={d.destinationName} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.navy }}>
                        {d.destinationName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: KUKAT.teal, fontWeight: 700 }}>
                        {d.bookingCount}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={(d.bookingCount / maxDest) * 100}
                      sx={{
                        height: 6, borderRadius: 3,
                        backgroundColor: `${KUKAT.teal}20`,
                        '& .MuiLinearProgress-bar': { backgroundColor: KUKAT.teal, borderRadius: 3 },
                      }}
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
      </Box>

      {/* ── ROW 4: Agent performance table ─────────────────── */}
      
      <Card sx={{ mb: 2.5,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr'},
      }}>
        <CardHeader
          title="Agent performance breakdown"
          titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
          subheader="Bookings, revenue and commissions per agent"
          subheaderTypographyProps={{ variant: 'caption' }}
        />
        <CardContent sx={{ pt: 0 }}>
          {rLoading ? <Skeleton variant="rounded" height={200} /> :
           agents.length === 0 ? (
            <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
              No data for this period.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    AGENT
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    TOTAL BOOKINGS
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    REVENUE
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    COMMISSIONS
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    CONVERSION
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((a, i) => {
                  const convRate = a.bookingCount > 0 ? Math.round((a.bookingCount / (a.bookingCount + (a.lostCount || 0))) * 100) : 0;
                  return (
                    <TableRow key={a.employeeID}
                      sx={{ background: i % 2 === 0 ? '#fff' : KUKAT.surface }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700,
                            background: `${KUKAT.navy}15`, color: KUKAT.navy,
                          }}>
                            {a.firstName?.[0]}{a.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {a.firstName} {a.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                              {a.agentCode}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>
                          {a.bookingCount?.toLocaleString() ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.teal }}>
                          {fmt(a.revenue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} sx={{ color: CHART_COLORS.purple }}>
                          {fmt(a.commission)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={convRate}
                            sx={{
                              flex: 1, height: 6, borderRadius: 3,
                              backgroundColor: `${KUKAT.teal}20`,
                              '& .MuiLinearProgress-bar': { backgroundColor: KUKAT.teal, borderRadius: 3 },
                            }}
                          />
                          <Typography variant="caption" fontWeight={700} sx={{ color: KUKAT.teal, minWidth: 30 }}>
                            {convRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── ROW 5: Donut chart + grouped bar chart ───────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' },
        gap: 2,
        mb: 3,
      }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title="Booking status"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
          />
          <CardContent sx={{ pt: 0 }}>
            {loading ? <Skeleton variant="rounded" height={240} /> :
              statusPie.length === 0 ? (
              <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No data.</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="45%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={3} dataKey="value">
                      {statusPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" iconSize={8}
                      wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ height: '100%' }}>
          <CardHeader
            title="Agent revenue vs commissions"
            titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
          />
          <CardContent sx={{ pt: 0 }}>
            {rLoading ? <Skeleton variant="rounded" height={240} /> :
              agentBarData.length === 0 ? (
              <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No data.</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentBarData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={KUKAT.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                      tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                      tickLine={false} axisLine={false} tickFormatter={fmtK} width={55} />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="revenue"    name="Revenue"    fill={KUKAT.teal}           radius={[4,4,0,0]} />
                    <Bar dataKey="commission" name="Commission" fill={CHART_COLORS.amber}    radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── ROW 6: Summary cards + info panel ──────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' },
        gap: 2,
        mb: 3,
      }}>
        <Card sx={{ height: '100%', background: KUKAT.navy }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: KUKAT.amberLight, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                — KUKAT Analytics
              </Typography>
              <Typography sx={{ color: '#fff',
                fontSize: '1.3rem', fontWeight: 700, mt: 1.5, mb: 1.5, lineHeight: 1.3 }}>
                Your agency performance at a glance
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Track bookings, revenue, commissions and agent performance across all time periods.
                Use the filters above to drill into specific windows.
              </Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Chip label="View reports →"
                onClick={() => navigate('/reports')}
                sx={{
                  background: KUKAT.amber, color: KUKAT.navy,
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                  '&:hover': { background: KUKAT.amberLight },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 2,
        }}>            
          {[
            {
              label: 'Total invoices',
              value: fmtShort(inv.total),
              sub: 'All time',
              icon: <Receipt sx={{ fontSize: 28, color: KUKAT.teal }} />,
              bg: `${KUKAT.teal}10`,
            },
            {
              label: 'Collected',
              value: fmtK(inv.totalCollected),
              sub: 'Paid invoices',
              icon: <AttachMoney sx={{ fontSize: 28, color: '#15803D' }} />,
              bg: '#DCFCE7',
            },
            {
              label: 'Pending commissions',
              value: fmtShort(comm.pending),
              sub: 'Awaiting approval',
              icon: <HourglassEmpty sx={{ fontSize: 28, color: CHART_COLORS.amber }} />,
              bg: '#FEF9C3',
            },
            {
              label: 'Top destination',
              value: destinations[0]?.destinationName?.split(' ')[0] ?? '—',
              sub: `${destinations[0]?.bookingCount ?? 0} bookings`,
              icon: <FlightTakeoff sx={{ fontSize: 28, color: CHART_COLORS.purple }} />,
              bg: `${CHART_COLORS.purple}10`,
            },
          ].map((item, i) => (
            <Grid item xs={6} key={i}>
              <Card sx={{ background: item.bg, boxShadow: 'none',
                border: `1px solid ${KUKAT.border}` }}>
                <CardContent sx={{ p: '16px !important' }}>
                  <Box sx={{ mb: 1 }}>{item.icon}</Box>
                  {loading || rLoading
                    ? <Skeleton width={60} height={28} />
                    : <Typography sx={{ fontSize: '1.4rem', fontWeight: 700,
                        color: KUKAT.navy, lineHeight: 1 }}>
                        {item.value}
                      </Typography>
                  }
                  <Typography variant="caption" sx={{ color: KUKAT.navy, fontWeight: 600,
                    display: 'block', mt: 0.3 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted, fontSize: '0.7rem' }}>
                    {item.sub}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Box>
      </Box>

      {/* ── ROW 7: Recent bookings + recent payments ───────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: 2,
      }}>
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
              (recentBookings ?? []).length === 0 ? (
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
                  {(recentBookings ?? []).map((b, i) => (
                    <TableRow key={b.bookingID}
                      sx={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : KUKAT.surface }}
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
            {loading ? <Skeleton variant="rounded" height={200} /> :
              (recentPayments ?? []).length === 0 ? (
              <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                No payments yet.
              </Typography>
            ) : (
              (recentPayments ?? []).map((p, i) => (
                <Box key={p.paymentID} onClick={() => navigate(`/invoices/${p.invoiceID}`)}
                  sx={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', py: 1.5,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${KUKAT.border}`,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { background: KUKAT.surface },
                  }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                      width: 32, height: 32, fontSize: '0.72rem', fontWeight: 700,
                      background: `${KUKAT.teal}15`, color: KUKAT.teal,
                    }}>
                      {p.customerName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.customerName}</Typography>
                      <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-CA') : '—'}
                        {' · '}{p.paymentMethod}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#15803D' }}>
                      {fmt(p.amountPaid)}
                    </Typography>
                    <StatusChip status={p.status} />
                  </Box>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>
    </>
  );
};
const TopStatCard = ({ label, value, icon, color, trend, trendValue, loading }) => {
  const isUp = trendValue >= 0;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: '20px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '12px',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color,
          }}>
            {icon}
          </Box>
          {trendValue != null && !loading && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.3,
              px: 1, py: 0.3, borderRadius: '20px',
              background: isUp ? '#DCFCE7' : '#FEE2E2',
            }}>
              {isUp
                ? <TrendingUp sx={{ fontSize: 13, color: '#15803D' }} />
                : <TrendingDown sx={{ fontSize: 13, color: '#DC2626' }} />}
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700,
                color: isUp ? '#15803D' : '#DC2626' }}>
                {Math.abs(trendValue)}%
              </Typography>
            </Box>
          )}
        </Box>
        {loading
          ? <Skeleton width={80} height={32} />
          : <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1 }}>
              {value}
            </Typography>
        }
        <Typography variant="caption" sx={{ color: KUKAT.textMuted, mt: 0.3, display: 'block' }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── HR Dashboard Component ──────────────────────────────────
const HRDashboard = ({ data, loading }) => {
  const navigate = useNavigate();

  const employeeStats = data?.employeeStats || {};
  const roleDistribution = data?.roleDistribution || [];
  const employeePerformance = data?.employeePerformance || [];
  const agentMetrics = data?.agentMetrics || {};

  // Pie chart data for role distribution
  const rolePieData = roleDistribution.map(r => ({
    name: r.roleName,
    value: r.count,
  }));

  return (
    <>
      <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
      {loading && <Alert severity="info" sx={{ mb: 2 }}>Loading HR dashboard...</Alert>}
        {/* ── ROW 1: Top stats ─────────────────────────────────── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: 1,
          mb: 3,
        }}>
          <TopStatCard label="Total employees" value={fmtShort(employeeStats.totalEmployees)}
            icon={<People />} color={KUKAT.navy}
            trendValue={employeeStats.newHiresThisYear > 0 ? 8 : 0} loading={loading} />
          <TopStatCard label="Active employees" value={fmtShort(employeeStats.activeEmployees)}
            icon={<CheckCircle />} color={KUKAT.teal}
            trendValue={15} loading={loading} />
          <TopStatCard label="New hires (this year)" value={fmtShort(employeeStats.newHiresThisYear)}
            icon={<TrendingUp />} color={CHART_COLORS.amber}
            trendValue={12} loading={loading} />
          <TopStatCard label="Avg bookings per agent" value={fmtShort(agentMetrics.avgBookingsPerAgent)}
            icon={<AccountBalance />} color={CHART_COLORS.purple}
            trendValue={-5} loading={loading} />
        </Box>

        {/* ── ROW 2: Charts ────────────────────────────────────── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Employee role distribution"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={300} /> :
              rolePieData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No data.</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rolePieData} cx="50%" cy="45%"
                        innerRadius={60} outerRadius={100}
                        paddingAngle={3} dataKey="value">
                        {rolePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend iconType="circle" iconSize={8}
                        wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Top performing employees"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={300} /> :
              employeePerformance.length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                  No performance data.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                        EMPLOYEE
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                        BOOKINGS
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                        REVENUE
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeePerformance.slice(0, 8).map((emp, i) => (
                      <TableRow key={emp.employeeID}
                        sx={{ background: i % 2 === 0 ? '#fff' : KUKAT.surface }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{
                              width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700,
                              background: `${KUKAT.navy}15`, color: KUKAT.navy,
                            }}>
                              {emp.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {emp.employeeName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                                {emp.agentCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {emp.bookingCount?.toLocaleString() ?? 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.teal }}>
                            {fmt(emp.totalRevenue)}
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
        
        {/* ── ROW 3: Summary and navigation ────────────────────── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' },
          gap: 2,
          mb: 3,
        }}>
          <Card sx={{ height: '100%', background: KUKAT.navy }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: KUKAT.amberLight, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                  — HR Analytics
                </Typography>
                <Typography sx={{ color: '#fff', fontFamily: '"Playfair Display", serif',
                  fontSize: '1.3rem', fontWeight: 700, mt: 1.5, mb: 1.5, lineHeight: 1.3 }}>
                  Employee performance and management
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  Track employee statistics, role distribution, and performance metrics.
                  Monitor new hires and agent productivity across the organization.
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Chip label="View employees →"
                  onClick={() => navigate('/staff')}
                  sx={{
                    background: KUKAT.amber, color: KUKAT.navy,
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                    '&:hover': { background: KUKAT.amberLight },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 2,
          }}>          
            {[
              {
                label: 'Active employees',
                value: fmtShort(employeeStats.activeEmployees),
                sub: `${employeeStats.totalEmployees} total`,
                icon: <People sx={{ fontSize: 28, color: KUKAT.teal }} />,
                bg: `${KUKAT.teal}10`,
              },
              {
                label: 'Role types',
                value: fmtShort(roleDistribution.length),
                sub: 'Different positions',
                icon: <AccountBalance sx={{ fontSize: 28, color: CHART_COLORS.amber }} />,
                bg: '#FEF9C3',
              },
              {
                label: 'Top performer',
                value: employeePerformance[0]?.bookingCount ?? 0,
                sub: 'Bookings this period',
                icon: <TrendingUp sx={{ fontSize: 28, color: '#15803D' }} />,
                bg: '#DCFCE7',
              },
              {
                label: 'Avg performance',
                value: fmtShort(agentMetrics.avgBookingsPerAgent),
                sub: 'Bookings per agent',
                icon: <CheckCircle sx={{ fontSize: 28, color: CHART_COLORS.purple }} />,
                bg: `${CHART_COLORS.purple}10`,
              },
            ].map((item, i) => (
              <Grid item xs={6} key={i}>
                <Card sx={{ background: item.bg, boxShadow: 'none',
                  border: `1px solid ${KUKAT.border}` }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box sx={{ mb: 1 }}>{item.icon}</Box>
                    {loading
                      ? <Skeleton width={60} height={28} />
                      : <Typography sx={{ fontSize: '1.4rem', fontWeight: 700,
                          color: KUKAT.navy, lineHeight: 1 }}>
                          {item.value}
                        </Typography>
                    }
                    <Typography variant="caption" sx={{ color: KUKAT.navy, fontWeight: 600,
                      display: 'block', mt: 0.3 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: KUKAT.textMuted, fontSize: '0.7rem' }}>
                      {item.sub}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
};

// ── Accountant Dashboard Component ──────────────────────────
const AccountantDashboard = ({ data, loading }) => {
  const navigate = useNavigate();

  const financialOverview = data?.financialOverview || {};
  const paymentMethods = data?.paymentMethods || [];
  const commissionPayments = data?.commissionPayments || {};
  const revenueTrend = data?.revenueTrend || [];
  const outstandingInvoices = data?.outstandingInvoices || [];

  // Payment methods bar chart data
  const paymentBarData = paymentMethods.map(pm => ({
    method: pm.paymentMethod,
    amount: parseFloat(pm.totalAmount || 0),
    count: pm.transactionCount || 0,
  }));

  // Revenue trend chart data
  const revenueChartData = revenueTrend.map(rt => ({
    label: `${rt.year}-${String(rt.month).padStart(2, '0')}`,
    revenue: parseFloat(rt.monthlyRevenue || 0),
  })).reverse();

  return (
    <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
      {loading && <Alert severity="info" sx={{ mb: 2 }}>Loading accountant dashboard...</Alert>}

      {/* ── ROW 1: Top financial stats ───────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <TopStatCard label="Total collected" value={fmtK(financialOverview.totalCollected)}
          icon={<AttachMoney />} color={KUKAT.teal}
          trendValue={16} loading={loading} />
        <TopStatCard label="Outstanding" value={fmtK(financialOverview.totalOutstanding)}
          icon={<HourglassEmpty />} color={CHART_COLORS.red}
          trendValue={-8} loading={loading} />
        <TopStatCard label="Commission payments" value={fmtK(commissionPayments.totalPaidCommissions)}
          icon={<AccountBalance />} color={CHART_COLORS.purple}
          trendValue={12} loading={loading} />
        <TopStatCard label="Avg commission rate" value={`${(commissionPayments.avgCommissionRate * 100 || 0).toFixed(1)}%`}
          icon={<TrendingUp />} color={CHART_COLORS.amber}
          trendValue={5} loading={loading} />
      </Box>

      {/* ── ROW 2: Charts ────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: 2,
        mb: 3,
      }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Revenue trend (last 12 months)"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={300} /> :
               revenueChartData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>No revenue data.</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${KUKAT.border}`} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                        tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                        tickLine={false} axisLine={false} tickFormatter={fmtK} width={55} />
                      <Tooltip content={<CustomTooltip isCurrency />} />
                      <defs>
                        <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={KUKAT.teal} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={KUKAT.teal} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="revenue"
                        stroke={KUKAT.teal} strokeWidth={2.5}
                        fill="url(#revenue-gradient)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Payment methods breakdown"
              titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
            />
            <CardContent sx={{ pt: 0 }}>
              {loading ? <Skeleton variant="rounded" height={300} /> :
               paymentBarData.length === 0 ? (
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
                  No payment data.
                </Typography>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentBarData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={KUKAT.border} vertical={false} />
                      <XAxis dataKey="method" tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                        tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: KUKAT.textMuted }}
                        tickLine={false} axisLine={false} tickFormatter={fmtK} width={55} />
                      <Tooltip content={<CustomTooltip isCurrency />} />
                      <Bar dataKey="amount" fill={KUKAT.teal} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
      </Box>

      {/* ── ROW 3: Outstanding invoices table ────────────────── */}
      <Card sx={{ mb: 2.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr' },
      }}>
        <CardHeader
          title="Outstanding invoices"
          titleTypographyProps={{ variant: 'h6', sx: { color: KUKAT.navy, fontSize: '1rem' } }}
          subheader="Invoices requiring payment attention"
          subheaderTypographyProps={{ variant: 'caption' }}
        />
        <CardContent sx={{ pt: 0 }}>
          {loading ? <Skeleton variant="rounded" height={200} /> :
           outstandingInvoices.length === 0 ? (
            <Typography variant="body2" sx={{ color: KUKAT.textMuted, py: 3, textAlign: 'center' }}>
              No outstanding invoices.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    CUSTOMER
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    AMOUNT
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    STATUS
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, background: KUKAT.navy, color: '#fff' }}>
                    DAYS OUTSTANDING
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outstandingInvoices.map((inv, i) => (
                  <TableRow key={inv.invoiceID}
                    sx={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : KUKAT.surface }}
                    onClick={() => navigate(`/invoices/${inv.invoiceID}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{inv.customerName}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600} sx={{ color: CHART_COLORS.red }}>
                        {fmt(inv.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <StatusChip status={inv.status} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {inv.daysOutstanding} days
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── ROW 4: Summary and navigation ────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: {xs: '1fr', md: '7fr 5fr'}, gap: 2, mb: 3 }}>
        <Card sx={{ height: '100%', background: KUKAT.navy }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: KUKAT.amberLight, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                — Financial Analytics
                </Typography>
                <Typography sx={{ color: '#fff', fontFamily: '"Playfair Display", serif',
                  fontSize: '1.3rem', fontWeight: 700, mt: 1.5, mb: 1.5, lineHeight: 1.3 }}>
                  Revenue tracking and payment management
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  Monitor financial performance, payment methods, commission payouts, and outstanding invoices.
                  Track revenue trends and ensure timely collections.
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Chip label="View invoices →"
                  onClick={() => navigate('/invoices')}
                  sx={{
                    background: KUKAT.amber, color: KUKAT.navy,
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                    '&:hover': { background: KUKAT.amberLight },
                  }}
                />
              </Box>
            </CardContent>
        </Card>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 2,
        }}>
          {[
            {
              label: 'Total invoices',
              value: fmtShort(financialOverview.totalInvoices),
              sub: 'All time',
              icon: <Receipt sx={{ fontSize: 28, color: KUKAT.teal }} />,
              bg: `${KUKAT.teal}10`,
            },
            {
              label: 'Payment methods',
              value: fmtShort(paymentMethods.length),
              sub: 'Active methods',
              icon: <AttachMoney sx={{ fontSize: 28, color: '#15803D' }} />,
              bg: '#DCFCE7',
            },
            {
              label: 'Pending commissions',
              value: fmtK(commissionPayments.pendingCommissions),
              sub: 'Awaiting payment',
              icon: <HourglassEmpty sx={{ fontSize: 28, color: CHART_COLORS.amber }} />,
              bg: '#FEF9C3',
            },
            {
              label: 'Outstanding amount',
              value: fmtK(financialOverview.totalOutstanding),
              sub: 'Needs collection',
              icon: <AccountBalance sx={{ fontSize: 28, color: CHART_COLORS.red }} />,
              bg: `${CHART_COLORS.red}10`,
            },
          ].map((item, i) => (
            <Grid item xs={6} key={i}>
              <Card sx={{ background: item.bg, boxShadow: 'none',
                border: `1px solid ${KUKAT.border}` }}>
                <CardContent sx={{ p: '16px !important' }}>
                  <Box sx={{ mb: 1 }}>{item.icon}</Box>
                  {loading
                    ? <Skeleton width={60} height={28} />
                    : <Typography sx={{ fontSize: '1.4rem', fontWeight: 700,
                        color: KUKAT.navy, lineHeight: 1 }}>
                        {item.value}
                      </Typography>
                  }
                  <Typography variant="caption" sx={{ color: KUKAT.navy, fontWeight: 600,
                    display: 'block', mt: 0.3 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted, fontSize: '0.7rem' }}>
                    {item.sub}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ── Row 2: Mini chart card ─────────────────────────────────────
const MiniChartCard = ({ title, value, sub, icon, data, dataKey, color, chartType = 'area', loading }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: '16px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: KUKAT.textMuted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
              {title}
            </Typography>
            {loading
              ? <Skeleton width={60} height={24} />
              : <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1.2 }}>
                  {value}
                </Typography>
            }
            {sub && (
              <Typography variant="caption" sx={{ color: KUKAT.textMuted, fontSize: '0.7rem' }}>
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{
              width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
              background: `${color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color, ml: 1,
            }}>
              {icon}
            </Box>
          )}
        </Box>
        {loading ? <Skeleton variant="rounded" height={70} /> : (
          <Box sx={{ height: 70, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
                  <Tooltip content={<CustomTooltip isCurrency={false} />} />
                </BarChart>
              ) : (
                <AreaChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`mini-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={dataKey}
                    stroke={color} strokeWidth={2}
                    fill={`url(#mini-${dataKey})`} dot={false} />
                  <Tooltip content={<CustomTooltip isCurrency={false} />} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const [period, setPeriod] = useState('all');

  const { data, loading, error }      = useDashboard({ period });
  const { report, loading: rLoading } = useReports({ period });

  // Role-based data extraction
  const userRole = user?.role;

  let bk, inv, comm, cust, trend, agents, destinations, products, statusPie, agentBarData;

  if (['superadmin', 'manager', 'accountant'].includes(userRole)) {
    bk   = data?.bookings    || {};
    inv  = data?.invoices    || {};
    comm = data?.commissions || {};
    cust = data?.customers   || {};
    
    trend        = report?.trend        ?? [];
    agents       = report?.agents       ?? [];
    destinations = report?.destinations ?? [];
    products     = report?.products     ?? [];

    // Pie data for booking status
    statusPie = [
      { name: 'Confirmed', value: bk.confirmed || 0 },
      { name: 'Pending',   value: bk.pending   || 0 },
      { name: 'Completed', value: bk.completed || 0 },
      { name: 'Cancelled', value: bk.cancelled || 0 },
    ].filter(d => d.value > 0);

    // Agent bar data
    agentBarData = agents.slice(0, 6).map(a => ({
      name:       a.firstName,
      bookings:   a.bookingCount || 0,
      revenue:    parseFloat(a.revenue    || 0),
      commission: parseFloat(a.commission || 0),
    }));
  }

  // Progress bar data for top destinations (for admin/manager/accountant)
  const maxDest = destinations ? Math.max(...destinations.map(d => d.bookingCount || 0), 1) : 1;

  const recentBookings = data?.recentBookings || [];
  const recentPayments = data?.recentPayments || [];

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Good day, ${user?.firstName}`}
    >
      <Box sx={{ width: '100%', maxWidth: '1600px', mx: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Period toggle ──────────────────────────────────── */}
      {['superadmin', 'manager'].includes(userRole) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <ToggleButtonGroup value={period} exclusive size="small"
            onChange={(_, v) => { if (v) setPeriod(v); }}
            sx={{
              '& .MuiToggleButton-root': {
                px: 2, py: 0.5, fontSize: '0.78rem', fontWeight: 500,
                textTransform: 'none', color: KUKAT.textMuted,
                border: `1.5px solid ${KUKAT.border}`,
                '&.Mui-selected': {
                  background: KUKAT.navy, color: '#fff',
                  borderColor: KUKAT.navy,
                  '&:hover': { background: KUKAT.navyLight },
                },
              },
            }}
          >
            {PERIODS.map(p => <ToggleButton key={p.value} value={p.value}>{p.label}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
      )}

      {userRole === 'hr' && <HRDashboard data={data} loading={loading} />}
      {userRole === 'accountant' && <AccountantDashboard data={data} loading={loading} />}
      {['superadmin', 'manager'].includes(userRole) && (
        <AdminDashboard
          bk={bk} inv={inv} comm={comm} cust={cust}
          trend={trend} agents={agents} destinations={destinations}
          statusPie={statusPie} agentBarData={agentBarData}
          loading={loading} rLoading={rLoading} navigate={navigate}
          maxDest={maxDest} recentBookings={recentBookings} recentPayments={recentPayments}
        />
      )}
      </Box>
    </AppLayout>
  );
}
